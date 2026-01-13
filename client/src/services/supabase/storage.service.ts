import { supabase } from '@/lib/supabase'

const STORAGE_BUCKET = 'project-files'

export type UploadFileOptions = {
  orgId: string
  projectId: string
  file: File
  onProgress?: (progress: number) => void
}

export type UploadResult = {
  path: string
  url: string
  fileId: string
}

/**
 * Generate a unique file ID
 */
const generateFileId = (): string => {
  return crypto.randomUUID()
}

/**
 * Get file extension from filename
 */
const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.substring(lastDot) : ''
}

/**
 * Upload a file directly to Supabase Storage
 */
export const uploadFileToStorage = async ({
  orgId,
  projectId,
  file,
  onProgress
}: UploadFileOptions): Promise<UploadResult> => {
  const fileId = generateFileId()
  const extension = getFileExtension(file.name)
  const fileName = `${fileId}${extension}`
  const storagePath = `${orgId}/${projectId}/${fileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

  if (error) {
    console.error('Error uploading file to storage:', error)
    throw error
  }

  // Simulate progress completion since Supabase JS doesn't support progress events natively
  // In production, you might use tus-js-client for resumable uploads with progress
  if (onProgress) {
    onProgress(100)
  }

  // Get the public URL for the file
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: urlData.publicUrl,
    fileId
  }
}

/**
 * Upload multiple files with progress tracking
 */
export const uploadFilesToStorage = async (
  orgId: string,
  projectId: string,
  files: File[],
  onFileProgress?: (fileName: string, progress: number) => void,
  onFileComplete?: (fileName: string, result: UploadResult) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = []

  for (const file of files) {
    try {
      const result = await uploadFileToStorage({
        orgId,
        projectId,
        file,
        onProgress: (progress) => onFileProgress?.(file.name, progress)
      })
      results.push(result)
      onFileComplete?.(file.name, result)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      throw error
    }
  }

  return results
}

/**
 * Delete a file from Supabase Storage
 */
export const deleteFileFromStorage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])

  if (error) {
    console.error('Error deleting file from storage:', error)
    throw error
  }
}

/**
 * Get a signed URL for private file access (if bucket is private)
 */
export const getSignedUrl = async (path: string, expiresIn: number = 3600): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }

  return data.signedUrl
}

/**
 * Get public URL for a file
 */
export const getPublicUrl = (path: string): string => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}
