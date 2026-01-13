-- RPC Functions for Complex Queries
-- These functions provide optimized data fetching for the client

-- ============================================
-- GET PROJECT WITH FULL STATS
-- ============================================

CREATE OR REPLACE FUNCTION get_project_with_stats(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  project_record RECORD;
  total_files INT;
  completed_files INT;
  skipped_files INT;
  annotation_classes_json JSON;
  data_managers_json JSON;
  reviewers_json JSON;
  annotators_json JSON;
BEGIN
  -- Get project
  SELECT * INTO project_record FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get file counts
  SELECT COUNT(*) INTO total_files FROM files WHERE project_id = p_project_id;
  SELECT COUNT(*) INTO completed_files FROM files WHERE project_id = p_project_id AND complete = true;
  SELECT COUNT(*) INTO skipped_files FROM files WHERE project_id = p_project_id AND skipped = true;

  -- Get annotation classes
  SELECT COALESCE(json_agg(json_build_object(
    'id', ac.id,
    'name', ac.name,
    'color', ac.color,
    'attributes', ac.attributes,
    'has_text', ac.has_text,
    'has_id', ac.has_id
  )), '[]'::json) INTO annotation_classes_json
  FROM annotation_classes ac
  WHERE ac.project_id = p_project_id;

  -- Get data managers
  SELECT COALESCE(json_agg(json_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email
  )), '[]'::json) INTO data_managers_json
  FROM project_data_managers pdm
  JOIN users u ON pdm.user_id = u.id
  WHERE pdm.project_id = p_project_id;

  -- Get reviewers
  SELECT COALESCE(json_agg(json_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email
  )), '[]'::json) INTO reviewers_json
  FROM project_reviewers pr
  JOIN users u ON pr.user_id = u.id
  WHERE pr.project_id = p_project_id;

  -- Get annotators
  SELECT COALESCE(json_agg(json_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email
  )), '[]'::json) INTO annotators_json
  FROM project_annotators pa
  JOIN users u ON pa.user_id = u.id
  WHERE pa.project_id = p_project_id;

  -- Build result
  result := json_build_object(
    'id', project_record.id,
    'name', project_record.name,
    'org_id', project_record.org_id,
    'task_type', project_record.task_type,
    'instructions', project_record.instructions,
    'storage', project_record.storage,
    'is_syncing', project_record.is_syncing,
    'synced_at', project_record.synced_at,
    'prefix', project_record.prefix,
    'default_class_id', project_record.default_class_id,
    'created_at', project_record.created_at,
    'updated_at', project_record.updated_at,
    'totalFiles', total_files,
    'completedFiles', completed_files,
    'skippedFiles', skipped_files,
    'annotationClasses', annotation_classes_json,
    'dataManagers', data_managers_json,
    'reviewers', reviewers_json,
    'annotators', annotators_json
  );

  RETURN result;
END;
$$;

-- ============================================
-- GET FILES WITH TAGS (PAGINATED)
-- ============================================

CREATE OR REPLACE FUNCTION get_files_with_tags(
  p_project_id UUID,
  p_skip INT DEFAULT 0,
  p_limit INT DEFAULT 50,
  p_annotator_id UUID DEFAULT NULL,
  p_complete BOOLEAN DEFAULT NULL,
  p_skipped BOOLEAN DEFAULT NULL,
  p_has_shapes BOOLEAN DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(file_data), '[]'::json) INTO result
  FROM (
    SELECT
      f.*,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', ac.id,
          'name', ac.name,
          'color', ac.color
        ))
        FROM file_tags ft
        JOIN annotation_classes ac ON ft.class_id = ac.id
        WHERE ft.file_id = f.id),
        '[]'::json
      ) as tags
    FROM files f
    WHERE f.project_id = p_project_id
      AND (p_annotator_id IS NULL OR f.annotator_id = p_annotator_id)
      AND (p_complete IS NULL OR f.complete = p_complete)
      AND (p_skipped IS NULL OR f.skipped = p_skipped)
      AND (p_has_shapes IS NULL OR f.has_shapes = p_has_shapes)
      AND (p_search IS NULL OR f.name ILIKE '%' || p_search || '%')
    ORDER BY f.created_at ASC
    OFFSET p_skip
    LIMIT p_limit
  ) file_data;

  RETURN result;
END;
$$;

-- ============================================
-- GET PROJECT STATS FOR DASHBOARD
-- ============================================

CREATE OR REPLACE FUNCTION get_project_dashboard_stats(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalFiles', (SELECT COUNT(*) FROM files WHERE project_id = p_project_id),
    'completedFiles', (SELECT COUNT(*) FROM files WHERE project_id = p_project_id AND complete = true),
    'skippedFiles', (SELECT COUNT(*) FROM files WHERE project_id = p_project_id AND skipped = true),
    'pendingFiles', (SELECT COUNT(*) FROM files WHERE project_id = p_project_id AND complete = false AND skipped = false),
    'assignedFiles', (SELECT COUNT(*) FROM files WHERE project_id = p_project_id AND annotator_id IS NOT NULL),
    'unassignedFiles', (SELECT COUNT(*) FROM files WHERE project_id = p_project_id AND annotator_id IS NULL),
    'totalShapes', (SELECT COUNT(*) FROM shapes WHERE project_id = p_project_id),
    'totalComments', (SELECT COUNT(*) FROM comments WHERE project_id = p_project_id),
    'annotatorStats', (
      SELECT COALESCE(json_agg(json_build_object(
        'userId', annotator_id,
        'userName', (SELECT name FROM users WHERE id = annotator_id),
        'assignedCount', COUNT(*),
        'completedCount', COUNT(*) FILTER (WHERE complete = true),
        'skippedCount', COUNT(*) FILTER (WHERE skipped = true)
      )), '[]'::json)
      FROM files
      WHERE project_id = p_project_id AND annotator_id IS NOT NULL
      GROUP BY annotator_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================
-- GET USER'S ASSIGNED FILES FOR A PROJECT
-- ============================================

CREATE OR REPLACE FUNCTION get_user_assigned_files(
  p_project_id UUID,
  p_user_id UUID,
  p_skip INT DEFAULT 0,
  p_limit INT DEFAULT 50,
  p_complete BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(file_data), '[]'::json) INTO result
  FROM (
    SELECT
      f.*,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', ac.id,
          'name', ac.name,
          'color', ac.color
        ))
        FROM file_tags ft
        JOIN annotation_classes ac ON ft.class_id = ac.id
        WHERE ft.file_id = f.id),
        '[]'::json
      ) as tags
    FROM files f
    WHERE f.project_id = p_project_id
      AND f.annotator_id = p_user_id
      AND (p_complete IS NULL OR f.complete = p_complete)
    ORDER BY f.created_at ASC
    OFFSET p_skip
    LIMIT p_limit
  ) file_data;

  RETURN result;
END;
$$;

-- ============================================
-- GET NEXT UNFINISHED FILE FOR ANNOTATOR
-- ============================================

CREATE OR REPLACE FUNCTION get_next_file_for_annotator(
  p_project_id UUID,
  p_user_id UUID,
  p_current_file_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(f.*) INTO result
  FROM files f
  WHERE f.project_id = p_project_id
    AND f.annotator_id = p_user_id
    AND f.complete = false
    AND f.skipped = false
    AND (p_current_file_id IS NULL OR f.id != p_current_file_id)
  ORDER BY f.created_at ASC
  LIMIT 1;

  RETURN result;
END;
$$;

-- ============================================
-- BULK ASSIGN FILES TO ANNOTATOR
-- ============================================

CREATE OR REPLACE FUNCTION bulk_assign_files(
  p_file_ids UUID[],
  p_annotator_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE files
  SET
    annotator_id = p_annotator_id,
    assigned_at = NOW()
  WHERE id = ANY(p_file_ids);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ============================================
-- BULK UNASSIGN FILES
-- ============================================

CREATE OR REPLACE FUNCTION bulk_unassign_files(p_file_ids UUID[])
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE files
  SET
    annotator_id = NULL,
    assigned_at = NULL
  WHERE id = ANY(p_file_ids);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
