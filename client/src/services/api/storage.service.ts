import axios from 'axios'
import { supabase } from '@/lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Helper to get auth token
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${data.session?.access_token}`,
  }
}

// ============================================
// FILE UPLOAD OPERATIONS
// ============================================

export type PresignedUrlResponse = {
  uploadUrl: string
  fileId: string
  key: string
}

export const getFileUploadUrl = async (
  orgId: string,
  projectId: string,
  fileName: string,
  contentType: string
): Promise<PresignedUrlResponse> => {
  const headers = await getAuthHeaders()
  const response = await axios.post(
    `${API_URL}/storage/presigned-url`,
    {
      orgId,
      projectId,
      fileName,
      contentType,
    },
    { headers }
  )
  return response.data
}

export const uploadFileToPresignedUrl = async (
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  })
}

export const completeFileUpload = async (
  orgId: string,
  projectId: string,
  fileId: string,
  key: string
): Promise<void> => {
  const headers = await getAuthHeaders()
  await axios.post(
    `${API_URL}/storage/complete-upload`,
    {
      orgId,
      projectId,
      fileId,
      key,
    },
    { headers }
  )
}

// Combined upload function for convenience
export const uploadFile = async (
  orgId: string,
  projectId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // 1. Get presigned URL
  const { uploadUrl, fileId, key } = await getFileUploadUrl(
    orgId,
    projectId,
    file.name,
    file.type
  )

  // 2. Upload file to storage
  await uploadFileToPresignedUrl(uploadUrl, file, onProgress)

  // 3. Complete the upload (server processes video, updates DB)
  await completeFileUpload(orgId, projectId, fileId, key)

  return fileId
}

// ============================================
// PROJECT OPERATIONS (that require storage sync)
// ============================================

export type CreateProjectInput = {
  name: string
  orgId: string
  taskType: 'classification' | 'object-annotation'
  storage: 'aws' | 'azure' | 'default'
  awsSecretAccessKey?: string
  awsAccessKeyId?: string
  awsRegion?: string
  awsBucketName?: string
  azureStorageAccount?: string
  azurePassKey?: string
  azureContainerName?: string
  prefix?: string
}

export const createProject = async (input: CreateProjectInput): Promise<{ id: string }> => {
  const headers = await getAuthHeaders()
  const response = await axios.post(`${API_URL}/projects`, input, { headers })
  return response.data
}

export const syncProject = async (projectId: string): Promise<void> => {
  const headers = await getAuthHeaders()
  await axios.post(`${API_URL}/projects/${projectId}/sync`, {}, { headers })
}

// ============================================
// COMMENT FILE UPLOADS
// ============================================

export const getCommentFileUploadUrl = async (
  orgId: string,
  projectId: string,
  commentId: string,
  fileName: string,
  contentType: string
): Promise<PresignedUrlResponse> => {
  const headers = await getAuthHeaders()
  const response = await axios.post(
    `${API_URL}/comment-files/upload-url`,
    {
      orgId,
      projectId,
      commentId,
      fileName,
      contentType,
    },
    { headers }
  )
  return response.data
}

export const completeCommentFileUpload = async (
  commentId: string,
  fileId: string,
  key: string,
  url: string
): Promise<void> => {
  const headers = await getAuthHeaders()
  await axios.post(
    `${API_URL}/comment-files/complete-upload`,
    {
      commentId,
      fileId,
      key,
      url,
    },
    { headers }
  )
}

export const uploadCommentFile = async (
  orgId: string,
  projectId: string,
  commentId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const { uploadUrl, fileId, key } = await getCommentFileUploadUrl(
    orgId,
    projectId,
    commentId,
    file.name,
    file.type
  )

  await uploadFileToPresignedUrl(uploadUrl, file, onProgress)

  const url = uploadUrl.split('?')[0] // Get the URL without query params
  await completeCommentFileUpload(commentId, fileId, key, url)

  return fileId
}

// ============================================
// INSTRUCTION FILE UPLOADS
// ============================================

export const uploadProjectInstructionFile = async (
  orgId: string,
  projectId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const headers = await getAuthHeaders()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('orgId', orgId)
  formData.append('projectId', projectId)

  const response = await axios.post(
    `${API_URL}/instruction-files/upload`,
    formData,
    {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }
  )

  return response.data.url
}

// ============================================
// EXPORT OPERATIONS
// ============================================

export type ExportFormat = 'json' | 'csv' | 'coco' | 'yolo'

export const exportAnnotations = async (
  projectId: string,
  format: ExportFormat = 'json',
  filters?: {
    annotatedAfter?: string
    classIds?: string[]
  }
): Promise<Blob> => {
  const headers = await getAuthHeaders()
  const response = await axios.post(
    `${API_URL}/exports/${projectId}`,
    {
      format,
      ...filters,
    },
    {
      headers,
      responseType: 'blob',
    }
  )
  return response.data
}

export const downloadExport = async (
  projectId: string,
  format: ExportFormat = 'json',
  fileName?: string
): Promise<void> => {
  const blob = await exportAnnotations(projectId, format)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || `export-${projectId}.${format === 'coco' ? 'json' : format}`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
