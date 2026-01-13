-- RLS Write Policies for Client-Side Operations
-- Run this migration after the initial schema setup
-- Note: Organization membership is derived from project role assignments (data_managers, reviewers, annotators)

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- These functions bypass RLS to avoid recursion issues when checking membership
-- ============================================

CREATE OR REPLACE FUNCTION is_project_data_manager(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_data_managers
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_project_reviewer(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_reviewers
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_project_annotator(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_annotators
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_project_data_manager(p_project_id)
    OR is_project_reviewer(p_project_id)
    OR is_project_annotator(p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_file_annotator(p_file_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.files
    WHERE id = p_file_id AND annotator_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_file_project_id(p_file_id UUID)
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT project_id INTO v_project_id FROM public.files WHERE id = p_file_id;
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ANNOTATION CLASSES
-- ============================================

CREATE POLICY "Users can insert annotation classes in their projects"
ON annotation_classes FOR INSERT
WITH CHECK (is_project_data_manager(project_id));

CREATE POLICY "Users can update annotation classes in their projects"
ON annotation_classes FOR UPDATE
USING (is_project_data_manager(project_id));

CREATE POLICY "Users can delete annotation classes in their projects"
ON annotation_classes FOR DELETE
USING (is_project_data_manager(project_id));

-- ============================================
-- SHAPES
-- ============================================

CREATE POLICY "Users can insert shapes in their assigned files or as data manager"
ON shapes FOR INSERT
WITH CHECK (
  is_file_annotator(file_id) OR is_project_data_manager(project_id)
);

CREATE POLICY "Users can update shapes in their assigned files or as data manager"
ON shapes FOR UPDATE
USING (
  is_file_annotator(file_id) OR is_project_data_manager(project_id)
);

CREATE POLICY "Users can delete shapes in their assigned files or as data manager"
ON shapes FOR DELETE
USING (
  is_file_annotator(file_id) OR is_project_data_manager(project_id)
);

-- ============================================
-- COMMENTS
-- ============================================

CREATE POLICY "Users can insert comments on accessible files"
ON comments FOR INSERT
WITH CHECK (is_project_member(project_id));

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments or as data manager"
ON comments FOR DELETE
USING (
  user_id = auth.uid() OR is_project_data_manager(project_id)
);

-- ============================================
-- FILES (update only - create/delete handled by server)
-- ============================================

CREATE POLICY "Users can update their assigned files or as data manager"
ON files FOR UPDATE
USING (
  annotator_id = auth.uid() OR is_project_data_manager(project_id)
);

-- ============================================
-- PROJECTS
-- ============================================

-- NOTE: RLS is disabled on projects table due to policy evaluation issues
-- Projects are created by authenticated users and access is controlled at the application level
-- To disable RLS on projects: ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Data managers can update their projects"
ON projects FOR UPDATE
USING (is_project_data_manager(id));

CREATE POLICY "Data managers can delete their projects"
ON projects FOR DELETE
USING (is_project_data_manager(id));

-- ============================================
-- INVITATIONS
-- ============================================

CREATE POLICY "Data managers can insert invitations for their projects"
ON invitations FOR INSERT
WITH CHECK (is_project_data_manager(project_id));

CREATE POLICY "Users can update invitations they received or sent"
ON invitations FOR UPDATE
USING (
  invitee_id = auth.uid() OR inviter_id = auth.uid()
);

CREATE POLICY "Data managers can delete invitations for their projects"
ON invitations FOR DELETE
USING (
  is_project_data_manager(project_id) OR invitee_id = auth.uid()
);

-- ============================================
-- ACTIONS
-- ============================================

CREATE POLICY "Users can insert actions for their projects"
ON actions FOR INSERT
WITH CHECK (is_project_member(project_id));

-- ============================================
-- FILE TAGS
-- ============================================

CREATE POLICY "Users can insert file tags for their assigned files or as data manager"
ON file_tags FOR INSERT
WITH CHECK (
  is_file_annotator(file_id) OR is_project_data_manager(get_file_project_id(file_id))
);

CREATE POLICY "Users can delete file tags for their assigned files or as data manager"
ON file_tags FOR DELETE
USING (
  is_file_annotator(file_id) OR is_project_data_manager(get_file_project_id(file_id))
);

-- ============================================
-- PROJECT MEMBERS (junction tables)
-- ============================================

CREATE POLICY "Data managers can manage project data managers"
ON project_data_managers FOR ALL
USING (is_project_data_manager(project_id));

CREATE POLICY "Data managers can manage project reviewers"
ON project_reviewers FOR ALL
USING (is_project_data_manager(project_id));

CREATE POLICY "Data managers can manage project annotators"
ON project_annotators FOR ALL
USING (is_project_data_manager(project_id));
