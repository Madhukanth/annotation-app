-- Supabase PostgreSQL Schema for Annotation Platform
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- User roles
CREATE TYPE user_role AS ENUM ('superadmin', 'orgadmin', 'user');

-- Storage types
CREATE TYPE storage_type AS ENUM ('aws', 'azure', 'default');

-- Task types
CREATE TYPE task_type AS ENUM ('classification', 'object-annotation');

-- File types
CREATE TYPE file_type AS ENUM ('image', 'video');

-- Shape types
CREATE TYPE shape_type AS ENUM ('polygon', 'rectangle', 'circle', 'face', 'line');

-- Action types
CREATE TYPE action_type AS ENUM ('viewed', 'annotated', 'skipped', 'mark_complete', 'mark_incomplete', 'classified');

-- Invitation roles
CREATE TYPE invite_role AS ENUM ('datamanager', 'reviewer', 'annotator');

-- Invitation status
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');

-- ============================================
-- TABLES
-- ============================================

-- 1. USERS table (linked to Supabase Auth)
-- Note: Supabase Auth handles email/password in auth.users
-- This table stores additional profile data
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATIONS table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    orgadmin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECTS table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    task_type task_type NOT NULL,
    instructions TEXT,
    storage storage_type NOT NULL DEFAULT 'default',
    -- AWS config
    aws_secret_access_key VARCHAR(255),
    aws_access_key_id VARCHAR(255),
    aws_region VARCHAR(50),
    aws_api_version VARCHAR(50),
    aws_bucket_name VARCHAR(255),
    -- Azure config
    azure_storage_account VARCHAR(255),
    azure_pass_key VARCHAR(255),
    azure_container_name VARCHAR(255),
    -- Sync status
    is_syncing BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    prefix VARCHAR(255),
    default_class_id UUID, -- FK added after annotation_classes table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project Data Managers junction table
CREATE TABLE public.project_data_managers (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 5. Project Reviewers junction table
CREATE TABLE public.project_reviewers (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 6. Project Annotators junction table
CREATE TABLE public.project_annotators (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 7. ANNOTATION CLASSES table
CREATE TABLE public.annotation_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    attributes TEXT[] DEFAULT '{}',
    has_text BOOLEAN DEFAULT FALSE,
    has_id BOOLEAN DEFAULT FALSE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    color VARCHAR(50) NOT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from projects to annotation_classes for default class
ALTER TABLE public.projects
ADD CONSTRAINT fk_default_class
FOREIGN KEY (default_class_id) REFERENCES public.annotation_classes(id) ON DELETE SET NULL;

-- 8. FILES table
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(500),
    name VARCHAR(500),
    url TEXT,
    relative_path TEXT,
    stored_in storage_type DEFAULT 'default',
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type file_type,
    annotator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    complete BOOLEAN DEFAULT FALSE,
    total_frames INTEGER DEFAULT 1,
    fps NUMERIC DEFAULT 1,
    duration NUMERIC DEFAULT 0,
    has_shapes BOOLEAN DEFAULT FALSE,
    annotated_at TIMESTAMPTZ,
    skipped BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    height INTEGER,
    width INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. File Tags junction table (replaces tags[] array in MongoDB)
CREATE TABLE public.file_tags (
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    annotation_class_id UUID NOT NULL REFERENCES public.annotation_classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (file_id, annotation_class_id)
);

-- 10. SHAPES table
CREATE TABLE public.shapes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type shape_type NOT NULL,
    notes TEXT DEFAULT '',
    stroke VARCHAR(50) DEFAULT 'red',
    stroke_width INTEGER DEFAULT 2,
    x NUMERIC,
    y NUMERIC,
    height NUMERIC,
    width NUMERIC,
    points JSONB, -- Array of {id, x, y} objects
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.annotation_classes(id) ON DELETE SET NULL,
    text_field VARCHAR(255),
    id_field VARCHAR(255),
    attribute VARCHAR(255),
    at_frame INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. COMMENTS table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    shape_id UUID REFERENCES public.shapes(id) ON DELETE SET NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. COMMENT FILES table
CREATE TABLE public.comment_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500),
    original_name VARCHAR(500),
    stored_in storage_type DEFAULT 'default',
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    url TEXT,
    relative_url TEXT,
    type file_type,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ACTIONS table
CREATE TABLE public.actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name action_type NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    shape_id UUID REFERENCES public.shapes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. INVITATIONS table
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role invite_role NOT NULL,
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status invite_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Migration ID Mapping table (for tracking MongoDB to PostgreSQL IDs)
CREATE TABLE public.migration_id_mapping (
    collection_name VARCHAR(50) NOT NULL,
    mongo_id VARCHAR(24) NOT NULL,
    supabase_uuid UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_name, mongo_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Files indexes (matching MongoDB indexes)
CREATE INDEX idx_files_project_id ON public.files(project_id);
CREATE INDEX idx_files_org_id ON public.files(org_id);
CREATE INDEX idx_files_annotator_id ON public.files(annotator_id);
CREATE INDEX idx_files_complete ON public.files(complete);
CREATE INDEX idx_files_skipped ON public.files(skipped);
CREATE INDEX idx_files_created_at ON public.files(created_at);
CREATE INDEX idx_files_completed_at ON public.files(completed_at);
CREATE INDEX idx_files_skipped_at ON public.files(skipped_at);

-- Shapes indexes
CREATE INDEX idx_shapes_file_id ON public.shapes(file_id);
CREATE INDEX idx_shapes_project_id ON public.shapes(project_id);
CREATE INDEX idx_shapes_class_id ON public.shapes(class_id);

-- Actions indexes
CREATE INDEX idx_actions_file_id ON public.actions(file_id);
CREATE INDEX idx_actions_project_id ON public.actions(project_id);
CREATE INDEX idx_actions_user_id ON public.actions(user_id);

-- Comments indexes
CREATE INDEX idx_comments_file_id ON public.comments(file_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- Invitations indexes
CREATE INDEX idx_invitations_invitee_id ON public.invitations(invitee_id);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_project_id ON public.invitations(project_id);

-- Annotation classes indexes
CREATE INDEX idx_annotation_classes_project_id ON public.annotation_classes(project_id);

-- Users index
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to set password hash directly (for migration)
-- This allows importing existing bcrypt hashes from MongoDB
CREATE OR REPLACE FUNCTION set_user_password_hash(p_user_id UUID, p_password_hash TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = p_password_hash
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke public access to this function (only callable via service role)
REVOKE ALL ON FUNCTION set_user_password_hash FROM PUBLIC;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's organizations via project membership
CREATE OR REPLACE FUNCTION get_user_organizations_via_projects(p_user_id UUID)
RETURNS TABLE (id UUID, name VARCHAR(255), orgadmin_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT o.id, o.name, o.orgadmin_id
  FROM public.organizations o
  JOIN public.projects p ON p.org_id = o.id
  WHERE EXISTS (
    SELECT 1 FROM public.project_data_managers pdm WHERE pdm.project_id = p.id AND pdm.user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.project_reviewers pr WHERE pr.project_id = p.id AND pr.user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.project_annotators pa WHERE pa.project_id = p.id AND pa.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users in an organization (via project membership or org admin)
CREATE OR REPLACE FUNCTION get_users_in_organization(p_org_id UUID)
RETURNS TABLE (id UUID, name VARCHAR(255), email VARCHAR(255), role user_role) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT u.id, u.name, u.email, u.role
  FROM public.users u
  WHERE u.id IN (
    -- Org admin
    SELECT o.orgadmin_id FROM public.organizations o WHERE o.id = p_org_id AND o.orgadmin_id IS NOT NULL
  )
  OR u.id IN (
    -- Data managers
    SELECT pdm.user_id FROM public.project_data_managers pdm
    JOIN public.projects p ON p.id = pdm.project_id
    WHERE p.org_id = p_org_id
  )
  OR u.id IN (
    -- Reviewers
    SELECT pr.user_id FROM public.project_reviewers pr
    JOIN public.projects p ON p.id = pr.project_id
    WHERE p.org_id = p_org_id
  )
  OR u.id IN (
    -- Annotators
    SELECT pa.user_id FROM public.project_annotators pa
    JOIN public.projects p ON p.id = pa.project_id
    WHERE p.org_id = p_org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS HELPER FUNCTIONS (SECURITY DEFINER)
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
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotation_classes_updated_at BEFORE UPDATE ON public.annotation_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shapes_updated_at BEFORE UPDATE ON public.shapes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_files_updated_at BEFORE UPDATE ON public.comment_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON public.actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_data_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_annotators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Service role can do everything (for backend operations)
-- Note: When using service role key, RLS is bypassed automatically

-- Policy: Allow authenticated users to read organizations they belong to (via project membership)
CREATE POLICY "Users can view their organizations" ON public.organizations
    FOR SELECT USING (
        orgadmin_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.org_id = id AND is_project_member(p.id)
        )
    );

-- Policy: Allow authenticated users to view projects they're members of
CREATE POLICY "Users can view their projects" ON public.projects
    FOR SELECT USING (is_project_member(id));

-- Policy: Project members can view project role assignments
CREATE POLICY "Project members can view data managers" ON public.project_data_managers
    FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Project members can view reviewers" ON public.project_reviewers
    FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Project members can view annotators" ON public.project_annotators
    FOR SELECT USING (is_project_member(project_id));

-- Policy: Project members can view files
CREATE POLICY "Project members can view files" ON public.files
    FOR SELECT USING (is_project_member(project_id));

-- Policy: Project members can view annotation classes
CREATE POLICY "Project members can view annotation classes" ON public.annotation_classes
    FOR SELECT USING (is_project_member(project_id));

-- Policy: Project members can view shapes
CREATE POLICY "Project members can view shapes" ON public.shapes
    FOR SELECT USING (is_project_member(project_id));

-- Policy: Project members can view comments
CREATE POLICY "Project members can view comments" ON public.comments
    FOR SELECT USING (is_project_member(project_id));

-- Policy: Project members can view comment files
CREATE POLICY "Project members can view comment files" ON public.comment_files
    FOR SELECT USING (is_project_member(project_id));

-- Policy: Project members can view actions
CREATE POLICY "Project members can view actions" ON public.actions
    FOR SELECT USING (is_project_member(project_id));

-- Policy: Project members can view file tags
CREATE POLICY "Project members can view file tags" ON public.file_tags
    FOR SELECT USING (is_project_member(get_file_project_id(file_id)));

-- Policy: Users can view their invitations
CREATE POLICY "Users can view their invitations" ON public.invitations
    FOR SELECT USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

-- Policy: Users can update invitations sent to them
CREATE POLICY "Users can update their invitations" ON public.invitations
    FOR UPDATE USING (invitee_id = auth.uid());
