import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20261120000000_habitflow_personal_workspace_schema.sql'
);
const sql = fs.readFileSync(migrationPath, 'utf8');

test('Workspace SQL Security Audit: RLS enabled on all 6 workspace tables', () => {
  const tables = [
    'public.workspace_preferences',
    'public.workspace_pages',
    'public.workspace_tasks',
    'public.workspace_tags',
    'public.workspace_task_tags',
    'public.workspace_page_links',
  ];
  for (const tbl of tables) {
    assert.match(
      sql,
      new RegExp(`ALTER TABLE ${tbl.replace('.', '\\.')} ENABLE ROW LEVEL SECURITY;`, 'i'),
      `Missing ENABLE ROW LEVEL SECURITY on ${tbl}`
    );
  }
});

test('Workspace SQL Security Audit: Dangerous privileges revoked from authenticated', () => {
  const tables = [
    'public.workspace_preferences',
    'public.workspace_pages',
    'public.workspace_tasks',
    'public.workspace_tags',
    'public.workspace_task_tags',
    'public.workspace_page_links',
  ];
  for (const tbl of tables) {
    assert.match(
      sql,
      new RegExp(`REVOKE TRUNCATE, TRIGGER, REFERENCES ON ${tbl.replace('.', '\\.')} FROM authenticated;`, 'i'),
      `Missing privilege hardening (TRUNCATE/TRIGGER/REFERENCES) on ${tbl}`
    );
    assert.match(
      sql,
      new RegExp(`REVOKE ALL ON ${tbl.replace('.', '\\.')} FROM PUBLIC, anon;`, 'i'),
      `Missing REVOKE ALL FROM PUBLIC, anon on ${tbl}`
    );
  }
});

test('Workspace SQL Security Audit: RLS strictly enforces owner isolation (auth.uid() = user_id)', () => {
  assert.match(sql, /CREATE POLICY "workspace_preferences_owner_policy"[\s\S]*?USING \(user_id = auth\.uid\(\)\)/i);
  assert.match(sql, /CREATE POLICY "workspace_pages_owner_policy"[\s\S]*?USING \(user_id = auth\.uid\(\)\)/i);
  assert.match(sql, /CREATE POLICY "workspace_tasks_owner_policy"[\s\S]*?USING \(user_id = auth\.uid\(\)\)/i);
  assert.match(sql, /CREATE POLICY "workspace_tags_owner_policy"[\s\S]*?USING \(user_id = auth\.uid\(\)\)/i);
  assert.match(sql, /CREATE POLICY "workspace_task_tags_owner_policy"[\s\S]*?USING \(user_id = auth\.uid\(\)\)/i);
  assert.match(sql, /CREATE POLICY "workspace_page_links_owner_policy"[\s\S]*?USING \(user_id = auth\.uid\(\)\)/i);
});

test('Workspace SQL Security Audit: Composite foreign keys enforce cross-account data isolation', () => {
  assert.match(sql, /CONSTRAINT fk_workspace_pages_parent FOREIGN KEY \(user_id, parent_page_id\)[\s\S]*?REFERENCES public\.workspace_pages\(user_id, id\)/i);
  assert.match(sql, /CONSTRAINT fk_workspace_tasks_page FOREIGN KEY \(user_id, page_id\)[\s\S]*?REFERENCES public\.workspace_pages\(user_id, id\)/i);
  assert.match(sql, /CONSTRAINT fk_workspace_task_tags_task FOREIGN KEY \(user_id, task_id\)[\s\S]*?REFERENCES public\.workspace_tasks\(user_id, id\)/i);
  assert.match(sql, /CONSTRAINT fk_workspace_task_tags_tag FOREIGN KEY \(user_id, tag_id\)[\s\S]*?REFERENCES public\.workspace_tags\(user_id, id\)/i);
  assert.match(sql, /CONSTRAINT fk_workspace_page_links_source FOREIGN KEY \(user_id, source_page_id\)[\s\S]*?REFERENCES public\.workspace_pages\(user_id, id\)/i);
  assert.match(sql, /CONSTRAINT fk_workspace_page_links_target FOREIGN KEY \(user_id, target_page_id\)[\s\S]*?REFERENCES public\.workspace_pages\(user_id, id\)/i);
});

test('Workspace SQL Security Audit: PostgreSQL 15+ column-specific ON DELETE SET NULL prevents user_id nullification', () => {
  assert.match(sql, /ON DELETE SET NULL \(parent_page_id\)/i, 'Parent page composite FK must specify column-specific (parent_page_id)');
  assert.match(sql, /ON DELETE SET NULL \(page_id\)/i, 'Task page composite FK must specify column-specific (page_id)');
});

test('Workspace SQL Security Audit: Trigger function hardened with empty search_path', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.fn_guard_workspace_ownership_and_hierarchy\(\)[\s\S]*?SET search_path = ''/i, 'Function must use empty search_path to eliminate search-path hijacking');
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.fn_guard_workspace_ownership_and_hierarchy\(\) FROM PUBLIC, anon;/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.fn_guard_workspace_ownership_and_hierarchy\(\) TO authenticated;/i);
});

test('Workspace SQL Security Audit: Loop and cycle checks prevent self-parenting and circular links', () => {
  assert.match(sql, /CONSTRAINT ck_workspace_pages_no_self_parent CHECK \(parent_page_id IS NULL OR parent_page_id <> id\)/i);
  assert.match(sql, /CONSTRAINT ck_workspace_page_links_no_self_link CHECK \(source_page_id <> target_page_id\)/i);
  assert.match(sql, /v_curr_parent = NEW\.id/i);
});

test('Workspace SQL Security Audit: Storage UPDATE policy checks both original and destination paths', () => {
  assert.match(sql, /CREATE POLICY "workspace_storage_owner_update"[\s\S]*?USING \([\s\S]*?WITH CHECK \(/i);
});

test('Workspace SQL Security Audit: Storage MIME types exclude unsafe SVGs to prevent stored XSS', () => {
  assert.doesNotMatch(sql, /image\/svg\+xml/i);
  assert.match(sql, /image\/png/i);
  assert.match(sql, /application\/pdf/i);
});
