-- Storage Bucket Setup for Project Files
-- This migration creates a storage bucket for uploading project files directly from the client

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================

-- Create the project-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,  -- Public bucket for easy access to images
  52428800,  -- 50MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Drop existing storage policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project files" ON storage.objects;

-- Helper function to check if user is org admin
CREATE OR REPLACE FUNCTION check_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_org_id AND orgadmin_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (
    -- User is org admin
    check_org_admin((string_to_array(name, '/'))[1]::uuid)
    OR
    -- User is a data manager of the project
    EXISTS (
      SELECT 1 FROM project_data_managers pdm
      JOIN projects p ON p.id = pdm.project_id
      WHERE pdm.user_id = auth.uid()
      AND p.org_id::text = (string_to_array(name, '/'))[1]
      AND p.id::text = (string_to_array(name, '/'))[2]
    )
  )
);

-- Allow anyone to read files from the bucket (public access)
CREATE POLICY "Public read access for project files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-files');

-- Allow data managers to update their project files
CREATE POLICY "Users can update their project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM project_data_managers pdm
    JOIN projects p ON p.id = pdm.project_id
    WHERE pdm.user_id = auth.uid()
    AND p.org_id::text = (string_to_array(name, '/'))[1]
    AND p.id::text = (string_to_array(name, '/'))[2]
  )
);

-- Allow data managers to delete their project files
CREATE POLICY "Users can delete their project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM project_data_managers pdm
    JOIN projects p ON p.id = pdm.project_id
    WHERE pdm.user_id = auth.uid()
    AND p.org_id::text = (string_to_array(name, '/'))[1]
    AND p.id::text = (string_to_array(name, '/'))[2]
  )
);

-- ============================================
-- DATABASE RLS POLICIES FOR DIRECT PROJECT CREATION
-- ============================================

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Org members can create projects" ON projects;
DROP POLICY IF EXISTS "Users can add themselves as initial data manager" ON project_data_managers;
DROP POLICY IF EXISTS "Data managers can insert files" ON files;
DROP POLICY IF EXISTS "Data managers can delete files" ON files;

-- Allow authenticated users who are org members to create projects
-- User must be: org admin, OR have any role (data manager, reviewer, annotator) in any project of this org
CREATE POLICY "Org members can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  -- User is org admin
  EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = org_id AND o.orgadmin_id = auth.uid()
  )
  OR
  -- User is a data manager in any project of this org
  EXISTS (
    SELECT 1 FROM project_data_managers pdm
    JOIN projects p ON p.id = pdm.project_id
    WHERE pdm.user_id = auth.uid() AND p.org_id = projects.org_id
  )
  OR
  -- User is a reviewer in any project of this org
  EXISTS (
    SELECT 1 FROM project_reviewers pr
    JOIN projects p ON p.id = pr.project_id
    WHERE pr.user_id = auth.uid() AND p.org_id = projects.org_id
  )
  OR
  -- User is an annotator in any project of this org
  EXISTS (
    SELECT 1 FROM project_annotators pa
    JOIN projects p ON p.id = pa.project_id
    WHERE pa.user_id = auth.uid() AND p.org_id = projects.org_id
  )
);

-- Allow project creators to add themselves as data managers
CREATE POLICY "Users can add themselves as initial data manager"
ON project_data_managers FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Allow data managers to insert files
CREATE POLICY "Data managers can insert files"
ON files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_data_managers
    WHERE project_id = files.project_id AND user_id = auth.uid()
  )
);

-- Allow data managers to delete files
CREATE POLICY "Data managers can delete files"
ON files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_data_managers
    WHERE project_id = files.project_id AND user_id = auth.uid()
  )
);
