/**
 * Supabase Client
 * Main Supabase client instance and database types
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Database types for TypeScript
export type UserRole = 'superadmin' | 'orgadmin' | 'user'
export type InviteRole = 'datamanager' | 'reviewer' | 'annotator'
export type InviteStatus = 'pending' | 'accepted' | 'declined'
export type StorageType = 'aws' | 'azure' | 'default'
export type TaskType = 'classification' | 'object-annotation'
export type FileType = 'image' | 'video'
export type ShapeType = 'polygon' | 'rectangle' | 'circle' | 'face' | 'line'
export type ActionType = 'viewed' | 'annotated' | 'skipped' | 'mark_complete' | 'mark_incomplete' | 'classified'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at?: string
  updated_at?: string
}

export interface Organization {
  id: string
  name: string
  orgadmin_id: string | null
  created_at?: string
  updated_at?: string
}

export interface Project {
  id: string
  name: string
  org_id: string
  task_type: TaskType
  instructions?: string
  storage: StorageType
  aws_secret_access_key?: string
  aws_access_key_id?: string
  aws_region?: string
  aws_api_version?: string
  aws_bucket_name?: string
  azure_storage_account?: string
  azure_pass_key?: string
  azure_container_name?: string
  is_syncing: boolean
  synced_at?: string
  prefix?: string
  default_class_id?: string
  created_at?: string
  updated_at?: string
}

export interface AnnotationClass {
  id: string
  name: string
  attributes: string[]
  has_text: boolean
  has_id: boolean
  org_id: string
  project_id: string
  color: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface File {
  id: string
  original_name?: string
  name?: string
  url?: string
  relative_path?: string
  stored_in: StorageType
  org_id: string
  project_id: string
  type?: FileType
  annotator_id?: string
  assigned_at?: string
  complete: boolean
  total_frames: number
  fps: number
  duration: number
  has_shapes: boolean
  annotated_at?: string
  skipped: boolean
  completed_at?: string
  skipped_at?: string
  height?: number
  width?: number
  created_at?: string
  updated_at?: string
}

export interface Shape {
  id: string
  name: string
  type: ShapeType
  notes?: string
  stroke: string
  stroke_width: number
  x?: number
  y?: number
  height?: number
  width?: number
  points?: { id: string; x: number; y: number }[]
  org_id: string
  project_id: string
  file_id: string
  class_id?: string
  text_field?: string
  id_field?: string
  attribute?: string
  at_frame: number
  created_at?: string
  updated_at?: string
}

export interface Comment {
  id: string
  user_id: string
  file_id: string
  project_id: string
  org_id: string
  shape_id?: string
  content?: string
  created_at?: string
  updated_at?: string
}

export interface Action {
  id: string
  name: ActionType
  user_id: string
  file_id: string
  project_id: string
  org_id: string
  shape_id?: string
  created_at?: string
  updated_at?: string
}

export interface Invitation {
  id: string
  project_id: string
  role: InviteRole
  inviter_id: string
  invitee_id: string
  status: InviteStatus
  created_at?: string
  updated_at?: string
}
