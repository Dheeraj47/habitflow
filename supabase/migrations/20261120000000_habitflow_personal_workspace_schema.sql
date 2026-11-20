-- ==============================================================================
-- HABITFLOW: PERSONAL WORKSPACE SCHEMA & ROW LEVEL SECURITY (PHASE 0.2 HARDENED)
-- Migration: 20261120000000_habitflow_personal_workspace_schema.sql
-- 
-- Phase 0.2 Relational & Security Audit Corrections:
-- 1. PostgreSQL 15+ Column-Specific ON DELETE SET NULL (column_name) on composite FKs:
--    - fk_workspace_pages_parent sets ONLY parent_page_id to NULL (user_id preserved).
--    - fk_workspace_tasks_page sets ONLY page_id to NULL (user_id preserved).
-- 2. Hardened SECURITY DEFINER Trigger Function:
--    - Locked with SET search_path = '' (zero search-path hijacking risk).
--    - Fully qualified public.workspace_pages and auth.uid() references.
--    - Hierarchy loop & cycle guards for both INSERT and UPDATE (max 32 levels).
--    - Execution stripped from PUBLIC and anon.
-- 3. Strict Cross-Account Relational Integrity via Composite Foreign Keys (user_id, id).
-- 4. Storage Security: Owner check on INSERT, SELECT, DELETE, and dual USING+WITH CHECK on UPDATE.
-- 5. SVG removed from allowed MIME types to eliminate stored XSS risks.
-- 6. Privilege hardening: TRUNCATE, TRIGGER, REFERENCES stripped from authenticated.
-- 7. Zero coupling with habits, streaks, XP, day ratings, budget, or challenges.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Workspace Preferences Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  active_view text NOT NULL DEFAULT 'home' CHECK (active_view IN ('home', 'tasks', 'pages', 'graph', 'calendar', 'vault')),
  sidebar_collapsed boolean NOT NULL DEFAULT false,
  theme_mode text NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light', 'system')),
  pinned_page_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  recent_page_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Workspace Pages & Documents Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_page_id uuid,
  title text NOT NULL DEFAULT 'Untitled',
  icon text DEFAULT '📄',
  cover_url text,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_template boolean NOT NULL DEFAULT false,
  order_index numeric NOT NULL DEFAULT 0,
  word_count integer NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key enabling composite foreign keys for cross-account protection
  CONSTRAINT uq_workspace_pages_user_id UNIQUE (user_id, id),
  -- Self-referencing composite FK: sets ONLY parent_page_id to NULL on parent deletion (user_id preserved)
  CONSTRAINT fk_workspace_pages_parent FOREIGN KEY (user_id, parent_page_id)
    REFERENCES public.workspace_pages(user_id, id) ON DELETE SET NULL (parent_page_id),
  -- Guard against direct self-parenting loop
  CONSTRAINT ck_workspace_pages_no_self_parent CHECK (parent_page_id IS NULL OR parent_page_id <> id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_pages_user_updated
  ON public.workspace_pages (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_pages_parent
  ON public.workspace_pages (user_id, parent_page_id, order_index);

CREATE INDEX IF NOT EXISTS idx_workspace_pages_favorites
  ON public.workspace_pages (user_id, is_favorite)
  WHERE is_favorite = true AND is_archived = false;

-- ------------------------------------------------------------------------------
-- 3. Workspace Tasks Table (Independent from HabitFlow habits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_id uuid,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  reminder_at timestamptz,
  recurrence text CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'custom')),
  is_recurring boolean NOT NULL DEFAULT false,
  subtasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index numeric NOT NULL DEFAULT 0,
  is_archived boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Composite unique key enabling composite foreign keys
  CONSTRAINT uq_workspace_tasks_user_id UNIQUE (user_id, id),
  -- Associated page composite FK: sets ONLY page_id to NULL on page deletion (user_id preserved)
  CONSTRAINT fk_workspace_tasks_page FOREIGN KEY (user_id, page_id)
    REFERENCES public.workspace_pages(user_id, id) ON DELETE SET NULL (page_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_user_status
  ON public.workspace_tasks (user_id, status, order_index);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_due_date
  ON public.workspace_tasks (user_id, due_date)
  WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_page
  ON public.workspace_tasks (user_id, page_id)
  WHERE page_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. Workspace Tags & Task Associations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_workspace_tags_user_name UNIQUE (user_id, name),
  CONSTRAINT uq_workspace_tags_user_id UNIQUE (user_id, id)
);

CREATE TABLE IF NOT EXISTS public.workspace_task_tags (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, tag_id),
  -- Composite FK: Task MUST belong to the exact same user_id
  CONSTRAINT fk_workspace_task_tags_task FOREIGN KEY (user_id, task_id)
    REFERENCES public.workspace_tasks(user_id, id) ON DELETE CASCADE,
  -- Composite FK: Tag MUST belong to the exact same user_id
  CONSTRAINT fk_workspace_task_tags_tag FOREIGN KEY (user_id, tag_id)
    REFERENCES public.workspace_tags(user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspace_task_tags_tag
  ON public.workspace_task_tags (tag_id, user_id);

-- ------------------------------------------------------------------------------
-- 5. Workspace Page Wiki-Links (Obsidian Knowledge Graph Cache)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_page_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_page_id uuid NOT NULL,
  target_page_id uuid NOT NULL,
  link_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_workspace_page_links UNIQUE (source_page_id, target_page_id),
  CONSTRAINT ck_workspace_page_links_no_self_link CHECK (source_page_id <> target_page_id),
  -- Composite FK: Source page MUST belong to the exact same user_id
  CONSTRAINT fk_workspace_page_links_source FOREIGN KEY (user_id, source_page_id)
    REFERENCES public.workspace_pages(user_id, id) ON DELETE CASCADE,
  -- Composite FK: Target page MUST belong to the exact same user_id
  CONSTRAINT fk_workspace_page_links_target FOREIGN KEY (user_id, target_page_id)
    REFERENCES public.workspace_pages(user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspace_page_links_target
  ON public.workspace_page_links (user_id, target_page_id);

CREATE INDEX IF NOT EXISTS idx_workspace_page_links_source
  ON public.workspace_page_links (user_id, source_page_id);

-- ------------------------------------------------------------------------------
-- 6. Hardened Anti-Tampering & Recursive Cycle Prevention Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_guard_workspace_ownership_and_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_curr_parent uuid;
  v_depth integer := 0;
BEGIN
  -- 1. Ensure authenticated user matches the row's user_id
  IF auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Ownership violation: Record user_id (%) does not match authenticated identity (%)', NEW.user_id, auth.uid();
  END IF;

  -- 2. Detect recursive page hierarchy cycles on workspace_pages (both INSERT and UPDATE)
  IF TG_TABLE_NAME = 'workspace_pages' AND NEW.parent_page_id IS NOT NULL THEN
    -- Direct self-parenting check
    IF NEW.parent_page_id = NEW.id THEN
      RAISE EXCEPTION 'Circular page hierarchy detected: Page % cannot be its own parent', NEW.id;
    END IF;

    -- Ancestor chain traversal up to 32 levels to prevent circular loops (e.g. A -> B -> A)
    v_curr_parent := NEW.parent_page_id;
    WHILE v_curr_parent IS NOT NULL AND v_depth < 32 LOOP
      IF v_curr_parent = NEW.id THEN
        RAISE EXCEPTION 'Circular page hierarchy detected: Page % cannot have ancestor %', NEW.id, NEW.parent_page_id;
      END IF;
      SELECT parent_page_id INTO v_curr_parent
      FROM public.workspace_pages
      WHERE id = v_curr_parent AND user_id = NEW.user_id;
      v_depth := v_depth + 1;
    END LOOP;
    IF v_depth >= 32 THEN
      RAISE EXCEPTION 'Page hierarchy depth exceeds limit (32 levels)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Secure trigger function permissions: stripped from PUBLIC & anon
REVOKE EXECUTE ON FUNCTION public.fn_guard_workspace_ownership_and_hierarchy() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_guard_workspace_ownership_and_hierarchy() TO authenticated;

DROP TRIGGER IF EXISTS trg_guard_workspace_page_security ON public.workspace_pages;
CREATE TRIGGER trg_guard_workspace_page_security
  BEFORE INSERT OR UPDATE ON public.workspace_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_workspace_ownership_and_hierarchy();

DROP TRIGGER IF EXISTS trg_guard_workspace_task_security ON public.workspace_tasks;
CREATE TRIGGER trg_guard_workspace_task_security
  BEFORE INSERT OR UPDATE ON public.workspace_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_workspace_ownership_and_hierarchy();

DROP TRIGGER IF EXISTS trg_guard_workspace_tag_security ON public.workspace_tags;
CREATE TRIGGER trg_guard_workspace_tag_security
  BEFORE INSERT OR UPDATE ON public.workspace_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_workspace_ownership_and_hierarchy();

DROP TRIGGER IF EXISTS trg_guard_workspace_task_tag_security ON public.workspace_task_tags;
CREATE TRIGGER trg_guard_workspace_task_tag_security
  BEFORE INSERT OR UPDATE ON public.workspace_task_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_workspace_ownership_and_hierarchy();

DROP TRIGGER IF EXISTS trg_guard_workspace_link_security ON public.workspace_page_links;
CREATE TRIGGER trg_guard_workspace_link_security
  BEFORE INSERT OR UPDATE ON public.workspace_page_links
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_workspace_ownership_and_hierarchy();

-- ------------------------------------------------------------------------------
-- 7. Row Level Security & Privilege Hardening
-- ------------------------------------------------------------------------------
ALTER TABLE public.workspace_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_page_links ENABLE ROW LEVEL SECURITY;

-- Strip dangerous operations from all roles
REVOKE ALL ON public.workspace_preferences FROM PUBLIC, anon;
REVOKE ALL ON public.workspace_pages FROM PUBLIC, anon;
REVOKE ALL ON public.workspace_tasks FROM PUBLIC, anon;
REVOKE ALL ON public.workspace_tags FROM PUBLIC, anon;
REVOKE ALL ON public.workspace_task_tags FROM PUBLIC, anon;
REVOKE ALL ON public.workspace_page_links FROM PUBLIC, anon;

REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.workspace_preferences FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.workspace_pages FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.workspace_tasks FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.workspace_tags FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.workspace_task_tags FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.workspace_page_links FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_task_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_page_links TO authenticated;

-- RLS Policies: Strictly User-Owned (No cross-account access whatsoever)
CREATE POLICY "workspace_preferences_owner_policy"
  ON public.workspace_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspace_pages_owner_policy"
  ON public.workspace_pages FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspace_tasks_owner_policy"
  ON public.workspace_tasks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspace_tags_owner_policy"
  ON public.workspace_tags FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspace_task_tags_owner_policy"
  ON public.workspace_task_tags FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspace_page_links_owner_policy"
  ON public.workspace_page_links FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. Hardened Private Workspace Storage Bucket & Policies
-- ------------------------------------------------------------------------------
-- Safe allowed MIME types (SVG intentionally excluded to eliminate stored XSS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-attachments',
  'workspace-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/markdown', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/markdown', 'text/plain'];

-- SELECT: Only owner can download/view files in their namespace
DROP POLICY IF EXISTS "workspace_storage_owner_select" ON storage.objects;
CREATE POLICY "workspace_storage_owner_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'workspace-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: Must upload strictly into user's own root folder
DROP POLICY IF EXISTS "workspace_storage_owner_insert" ON storage.objects;
CREATE POLICY "workspace_storage_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'workspace-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Must be owner of both original path and destination path (prevents moving files to another user namespace)
DROP POLICY IF EXISTS "workspace_storage_owner_update" ON storage.objects;
CREATE POLICY "workspace_storage_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'workspace-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'workspace-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Only owner can delete files in their namespace
DROP POLICY IF EXISTS "workspace_storage_owner_delete" ON storage.objects;
CREATE POLICY "workspace_storage_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'workspace-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
