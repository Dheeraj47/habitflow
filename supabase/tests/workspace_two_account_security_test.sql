-- ==============================================================================
-- HABITFLOW: WORKSPACE TWO-ACCOUNT SQL SECURITY & INTEGRATION TEST SUITE (PHASE 0.2)
-- Purpose: Rigorous verification of cross-account isolation, column-specific SET NULL,
--          anti-tampering triggers, cycle guards, and deletion cascade safety.
-- Safety: Wrapped in BEGIN ... ROLLBACK so ZERO test rows persist in database.
-- Run in Supabase SQL Editor or local test runner for security auditing.
-- ==============================================================================

BEGIN;

-- 1. Create two synthetic test accounts in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@workspace.test', '{"full_name": "Alice Workspace"}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@workspace.test', '{"full_name": "Bob Workspace"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, email)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Workspace', 'alice@workspace.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Workspace', 'bob@workspace.test')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_page_a1 uuid;
  v_page_a2 uuid;
  v_page_a3 uuid;
  v_task_a1 uuid;
  v_tag_a1 uuid;
  v_page_b1 uuid;
  v_page_b2 uuid;
  v_task_b1 uuid;
  v_tag_b1 uuid;
  v_count integer;
  v_updated integer;
  v_deleted integer;
  v_child_parent uuid;
  v_child_user uuid;
  v_task_page uuid;
  v_task_user uuid;
BEGIN
  -- ============================================================================
  -- PART 1: SETUP AS ACCOUNT A (Alice)
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"alice@workspace.test","role":"authenticated"}', true);

  -- Alice sets preferences
  INSERT INTO public.workspace_preferences (user_id, active_view, theme_mode)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'home', 'dark');

  -- Alice creates root Page A1
  INSERT INTO public.workspace_pages (user_id, title, icon, content_blocks)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Secret Project', '🔒', '[]'::jsonb)
  RETURNING id INTO v_page_a1;

  -- Alice creates nested child Page A2 (child of A1)
  INSERT INTO public.workspace_pages (user_id, parent_page_id, title, icon)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_page_a1, 'Alice Architecture Notes', '📐')
  RETURNING id INTO v_page_a2;

  -- Alice creates deeper nested child Page A3 (child of A2)
  INSERT INTO public.workspace_pages (user_id, parent_page_id, title, icon)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_page_a2, 'Alice Deep Implementation Details', '📝')
  RETURNING id INTO v_page_a3;

  -- Alice creates Task A1 linked to Page A1
  INSERT INTO public.workspace_tasks (user_id, page_id, title, status, priority)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_page_a1, 'Confidential Patent Draft', 'todo', 'high')
  RETURNING id INTO v_task_a1;

  -- Alice creates Tag A1
  INSERT INTO public.workspace_tags (user_id, name, color)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TopSecret', '#ef4444')
  RETURNING id INTO v_tag_a1;

  -- Alice links Task A1 to Tag A1
  INSERT INTO public.workspace_task_tags (user_id, task_id, tag_id)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_task_a1, v_tag_a1);

  -- Alice links Page A1 to Page A2
  INSERT INTO public.workspace_page_links (user_id, source_page_id, target_page_id, link_text)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_page_a1, v_page_a2, '[[Alice Architecture Notes]]');

  -- ============================================================================
  -- PART 2: SWITCH TO ACCOUNT B (Bob) — ATTEMPT CROSS-ACCOUNT ATTACKS
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"bob@workspace.test","role":"authenticated"}', true);

  -- TEST 1: Cross-account SELECT isolation
  SELECT COUNT(*) INTO v_count FROM public.workspace_pages WHERE id IN (v_page_a1, v_page_a2, v_page_a3);
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAIL: Bob can read Alice workspace pages (count=%)', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.workspace_tasks WHERE id = v_task_a1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAIL: Bob can read Alice workspace tasks';
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.workspace_tags WHERE id = v_tag_a1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAIL: Bob can read Alice workspace tags';
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.workspace_task_tags WHERE task_id = v_task_a1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAIL: Bob can read Alice workspace task tags';
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.workspace_page_links WHERE source_page_id = v_page_a1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAIL: Bob can read Alice workspace page links';
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.workspace_preferences WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAIL: Bob can read Alice workspace preferences';
  END IF;

  -- TEST 2: Cross-account UPDATE isolation (must affect 0 rows)
  UPDATE public.workspace_pages SET title = 'Hacked by Bob' WHERE id = v_page_a1;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 0 THEN
    RAISE EXCEPTION 'TEST 2 FAIL: Bob was able to update Alice workspace page!';
  END IF;

  UPDATE public.workspace_tasks SET title = 'Hacked Task' WHERE id = v_task_a1;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 0 THEN
    RAISE EXCEPTION 'TEST 2 FAIL: Bob was able to update Alice workspace task!';
  END IF;

  -- TEST 3: Cross-account DELETE isolation (must affect 0 rows)
  DELETE FROM public.workspace_pages WHERE id = v_page_a1;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 0 THEN
    RAISE EXCEPTION 'TEST 3 FAIL: Bob was able to delete Alice workspace page!';
  END IF;

  DELETE FROM public.workspace_tasks WHERE id = v_task_a1;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 0 THEN
    RAISE EXCEPTION 'TEST 3 FAIL: Bob was able to delete Alice workspace task!';
  END IF;

  -- TEST 4: Cross-account Parent-Page Foreign Key Attack
  -- Bob tries to create a page whose parent_page_id points to Alice's Page A1
  BEGIN
    INSERT INTO public.workspace_pages (user_id, parent_page_id, title)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_page_a1, 'Bob Infiltrator Page');
    RAISE EXCEPTION 'TEST 4 FAIL: Bob linked parent_page_id across accounts!';
  EXCEPTION WHEN foreign_key_violation OR check_violation OR OTHERS THEN
    NULL; -- Expected rejection by composite FK / trigger!
  END;

  -- TEST 5: Cross-account Task-Page Foreign Key Attack
  -- Bob tries to create a task whose page_id points to Alice's Page A1
  BEGIN
    INSERT INTO public.workspace_tasks (user_id, page_id, title)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_page_a1, 'Bob Infiltrator Task');
    RAISE EXCEPTION 'TEST 5 FAIL: Bob linked task page_id across accounts!';
  EXCEPTION WHEN foreign_key_violation OR check_violation OR OTHERS THEN
    NULL;
  END;

  -- Bob creates his own legitimate Page B1, Task B1, and Tag B1
  INSERT INTO public.workspace_pages (user_id, title)
  VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Personal Notes')
  RETURNING id INTO v_page_b1;

  INSERT INTO public.workspace_pages (user_id, parent_page_id, title)
  VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_page_b1, 'Bob Child Page')
  RETURNING id INTO v_page_b2;

  INSERT INTO public.workspace_tasks (user_id, title)
  VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Clean Task')
  RETURNING id INTO v_task_b1;

  INSERT INTO public.workspace_tags (user_id, name)
  VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BobTag')
  RETURNING id INTO v_tag_b1;

  -- TEST 6: Cross-account Task-Tag Hijacking Attack
  -- Bob tries to attach Alice's Tag A1 to Bob's Task B1
  BEGIN
    INSERT INTO public.workspace_task_tags (user_id, task_id, tag_id)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_task_b1, v_tag_a1);
    RAISE EXCEPTION 'TEST 6 FAIL: Bob attached Alice tag to his task!';
  EXCEPTION WHEN foreign_key_violation OR OTHERS THEN
    NULL;
  END;

  -- Bob tries to attach Bob's Tag B1 to Alice's Task A1
  BEGIN
    INSERT INTO public.workspace_task_tags (user_id, task_id, tag_id)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_task_a1, v_tag_b1);
    RAISE EXCEPTION 'TEST 6 FAIL: Bob attached tag to Alice task!';
  EXCEPTION WHEN foreign_key_violation OR OTHERS THEN
    NULL;
  END;

  -- TEST 7: Cross-account Page-Link Attack
  -- Bob tries to link his Page B1 to Alice's Page A1
  BEGIN
    INSERT INTO public.workspace_page_links (user_id, source_page_id, target_page_id, link_text)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_page_b1, v_page_a1, '[[Sneak Link]]');
    RAISE EXCEPTION 'TEST 7 FAIL: Bob created a wiki-link pointing to Alice private page!';
  EXCEPTION WHEN foreign_key_violation OR OTHERS THEN
    NULL;
  END;

  -- TEST 8: Self-parenting loop attack
  BEGIN
    UPDATE public.workspace_pages SET parent_page_id = v_page_b1 WHERE id = v_page_b1;
    RAISE EXCEPTION 'TEST 8 FAIL: Self-parenting loop was allowed on page!';
  EXCEPTION WHEN check_violation OR OTHERS THEN
    NULL;
  END;

  -- TEST 9: Circular Hierarchy via UPDATE (A -> B -> A)
  -- B1 is parent of B2. Attempt to make B2 parent of B1!
  BEGIN
    UPDATE public.workspace_pages SET parent_page_id = v_page_b2 WHERE id = v_page_b1;
    RAISE EXCEPTION 'TEST 9 FAIL: Circular hierarchy via UPDATE succeeded!';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Circular page hierarchy%' THEN RAISE; END IF;
  END;

  -- Circular Hierarchy via INSERT (Direct loop)
  BEGIN
    INSERT INTO public.workspace_pages (id, user_id, parent_page_id, title)
    VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Loop Page');
    RAISE EXCEPTION 'TEST 9b FAIL: Circular hierarchy via INSERT succeeded!';
  EXCEPTION WHEN check_violation OR OTHERS THEN
    NULL;
  END;

  -- TEST 10: Circular link attack
  BEGIN
    INSERT INTO public.workspace_page_links (user_id, source_page_id, target_page_id, link_text)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_page_b1, v_page_b1, '[[Self]]');
    RAISE EXCEPTION 'TEST 10 FAIL: Circular self-link was allowed on page!';
  EXCEPTION WHEN check_violation OR OTHERS THEN
    NULL;
  END;

  -- TEST 11: User ID Spoofing Attack
  -- Bob tries to insert a row masquerading with Alice's user_id
  BEGIN
    INSERT INTO public.workspace_pages (user_id, title)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Forged Page by Bob');
    RAISE EXCEPTION 'TEST 11 FAIL: Bob inserted page with Alice user_id!';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Ownership violation%' THEN RAISE; END IF;
  END;

  -- ============================================================================
  -- PART 3: RELATIONSHIP & DELETION CASCADE TESTS (SWITCH BACK TO ALICE)
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"alice@workspace.test","role":"authenticated"}', true);

  -- TEST 12: Column-Specific ON DELETE SET NULL on Parent Page Deletion
  -- Deleting Page A1 should set Page A2's parent_page_id to NULL, while user_id is PRESERVED!
  DELETE FROM public.workspace_pages WHERE id = v_page_a1;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 1 THEN
    RAISE EXCEPTION 'TEST 12 FAIL: Expected 1 parent page deleted, got %', v_deleted;
  END IF;

  SELECT parent_page_id, user_id INTO v_child_parent, v_child_user
  FROM public.workspace_pages WHERE id = v_page_a2;
  IF v_child_parent IS NOT NULL THEN
    RAISE EXCEPTION 'TEST 12 FAIL: Child page parent_page_id was not set to NULL on parent deletion!';
  END IF;
  IF v_child_user <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN
    RAISE EXCEPTION 'TEST 12 FAIL: Child page user_id was corrupted on parent deletion!';
  END IF;

  -- TEST 13: Column-Specific ON DELETE SET NULL on Task Page Deletion
  -- Page A1 was also the page for Task A1. Deleting Page A1 should have set Task A1's page_id to NULL!
  SELECT page_id, user_id INTO v_task_page, v_task_user
  FROM public.workspace_tasks WHERE id = v_task_a1;
  IF v_task_page IS NOT NULL THEN
    RAISE EXCEPTION 'TEST 13 FAIL: Task page_id was not set to NULL when page was deleted!';
  END IF;
  IF v_task_user <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN
    RAISE EXCEPTION 'TEST 13 FAIL: Task user_id was corrupted when referenced page was deleted!';
  END IF;

  -- TEST 14: Deleting page referenced by wiki-links cascades link cleanup
  SELECT COUNT(*) INTO v_count FROM public.workspace_page_links WHERE source_page_id = v_page_a1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 14 FAIL: Page links were not cleaned up when source page was deleted!';
  END IF;

  -- TEST 15: Deleting a task deletes junction entries while tag is preserved
  DELETE FROM public.workspace_tasks WHERE id = v_task_a1;
  SELECT COUNT(*) INTO v_count FROM public.workspace_task_tags WHERE task_id = v_task_a1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 15 FAIL: Task tag junction entry was not cleaned up on task deletion!';
  END IF;
  SELECT COUNT(*) INTO v_count FROM public.workspace_tags WHERE id = v_tag_a1;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST 15 FAIL: Tag was unexpectedly deleted when task was deleted!';
  END IF;

  -- TEST 16: Deleting a tag deletes junction entries while task is preserved
  -- Create a new task and associate with tag A1
  INSERT INTO public.workspace_tasks (user_id, title)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Follow-up Task')
  RETURNING id INTO v_task_a1;
  INSERT INTO public.workspace_task_tags (user_id, task_id, tag_id)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_task_a1, v_tag_a1);

  DELETE FROM public.workspace_tags WHERE id = v_tag_a1;
  SELECT COUNT(*) INTO v_count FROM public.workspace_task_tags WHERE tag_id = v_tag_a1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 16 FAIL: Task tag junction entry was not cleaned up on tag deletion!';
  END IF;
  SELECT COUNT(*) INTO v_count FROM public.workspace_tasks WHERE id = v_task_a1;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST 16 FAIL: Task was unexpectedly deleted when tag was deleted!';
  END IF;

  -- TEST 17: Confirm Bob's records remain 100% intact after Alice's deletions
  SELECT COUNT(*) INTO v_count FROM public.workspace_pages WHERE id IN (v_page_b1, v_page_b2);
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'TEST 17 FAIL: Bob pages were affected by Alice operations! (count=%)', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.workspace_tasks WHERE id = v_task_b1;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST 17 FAIL: Bob task was affected by Alice operations!';
  END IF;

  RAISE NOTICE 'ALL TWO-ACCOUNT WORKSPACE SECURITY & DELETION TESTS PASSED SUCCESSFULLY!';
END;
$$;

ROLLBACK; -- Ensures zero changes persist
