/**
 * Axios API Client
 * Server-dependent operations that require backend interaction
 *
 * For database operations, use:
 * - import { annotationClassesService, shapesService, ... } from '@/services/supabase'
 * - import { useAnnotationClasses, useShapes, ... } from '@/hooks'
 */

import axios, { AxiosRequestConfig, GenericAbortSignal, Method } from 'axios'
import { supabase } from '../supabase/client'
import type { StorageType } from '@/types'

export const setAxiosDefaults = () => {
  axios.defaults.baseURL = import.meta.env.VITE_SERVER_ENDPOINT

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      console.error('Error response:', error.response)
      if (error.response && error.response.status === 401) {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
}

// Set auth token from Supabase session
export const setAuthToken = async (token?: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    return
  }
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.session.access_token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }
}

export const getNotAuthAxios = () => {
  const instance = axios.create()
  delete instance.defaults.headers.common['Authorization']
  return instance
}

const queryFetcher = async (
  url: string,
  queryParams?: { [key: string]: string },
  config?: AxiosRequestConfig,
  signal?: GenericAbortSignal
) => {
  await setAuthToken()
  const { data } = await axios({
    method: 'GET',
    url,
    params: queryParams,
    signal,
    ...config
  })
  return data
}

const queryMutator = async (
  method: Method,
  url: string,
  queryParams: { [key: string]: string } = {},
  data: unknown = {},
  config: AxiosRequestConfig = {},
  signal?: GenericAbortSignal
) => {
  await setAuthToken()
  const { data: resData } = await axios({
    method,
    url,
    data,
    params: queryParams,
    signal,
    ...config
  })
  return resData
}

// ---------------------------------------- File Upload Operations ------------------------------------------

type FileTypesType = 'image' | 'video'

/**
 * Create a presigned URL for file upload
 */
export const createFileUploadUrl = (data: {
  orgId: string
  projectId: string
  originalName: string
  type: string
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/upload-url`,
    {},
    { originalName: data.originalName, type: data.type }
  )
}

/**
 * Upload a file to storage (default, AWS, or Azure)
 */
export const uploadFileMutator = (data: {
  url: string
  uploadFile: File
  projectId: string
  orgId: string
  storage: StorageType
  onProgress: (progress: number) => void
}) => {
  if (data.storage === 'default') {
    const formData = new FormData()
    formData.append('file', data.uploadFile)
    return queryMutator('PUT', data.url, {}, formData, {
      onUploadProgress: function ({ loaded, total }) {
        if (!total) return

        const percentCompleted = Math.round((loaded * 100) / total)
        if (data.onProgress) {
          data.onProgress(percentCompleted)
        }
      }
    })
  }

  const headers: { [header: string]: string } = {}
  if (data.storage === 'aws') {
    headers['Content-Type'] = data.uploadFile.type
  }

  if (data.storage === 'azure') {
    headers['x-ms-blob-type'] = 'BlockBlob'
  }

  return getNotAuthAxios().put(data.url, data.uploadFile, {
    headers,
    onUploadProgress: function ({ loaded, total }) {
      if (!total) return

      const percentCompleted = Math.round((loaded * 100) / total)
      if (data.onProgress) {
        data.onProgress(percentCompleted)
      }
    }
  })
}

/**
 * Complete file upload - notify server that upload is complete
 */
export const completeFileUpload = (data: {
  orgId: string
  projectId: string
  fileId: string
  relativePath: string
  originalName: string
  name: string
  totalFrames: number
  fps: number
  type: FileTypesType
  duration: number
}) => {
  const { orgId, projectId, fileId, ...restData } = data
  return queryMutator(
    'POST',
    `/orgs/${orgId}/projects/${projectId}/files/${fileId}/complete`,
    {},
    { ...restData }
  )
}

// ---------------------------------------- Comment File Upload Operations ------------------------------------------

/**
 * Create presigned URL for comment file upload
 */
export const createCommentFileUploadUrl = (data: {
  orgId: string
  projectId: string
  fileId: string
  commentId: string
  originalName: string
  type: string
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/comments/${data.commentId}/commentfiles/upload-url`,
    {},
    { originalName: data.originalName, type: data.type }
  )
}

/**
 * Upload comment file to storage
 */
export const uploadCommentFile = (data: {
  orgId: string
  projectId: string
  fileId: string
  commentId: string
  commentFileId: string
  url: string
  uploadFile: File
  storage: StorageType
  onProgress: (progress: number) => void
}) => {
  if (data.storage === 'default') {
    const formData = new FormData()
    formData.append('file', data.uploadFile)
    return queryMutator(
      'PUT',
      `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/comments/${data.commentId}/commentfiles/${data.commentFileId}/upload`,
      {},
      formData,
      {
        onUploadProgress: function ({ loaded, total }) {
          if (!total) return

          const percentCompleted = Math.round((loaded * 100) / total)
          if (data.onProgress) {
            data.onProgress(percentCompleted)
          }
        }
      }
    )
  }

  const headers: { [header: string]: string } = {}
  if (data.storage === 'aws') {
    headers['Content-Type'] = data.uploadFile.type
  }

  if (data.storage === 'azure') {
    headers['x-ms-blob-type'] = 'BlockBlob'
  }

  return getNotAuthAxios().put(data.url, data.uploadFile, { headers })
}

/**
 * Complete comment file upload
 */
export const completeCommentFileUpload = (data: {
  orgId: string
  projectId: string
  fileId: string
  commentId: string
  commentFileId: string
  originalName: string
  name: string
  relativePath: string
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/comments/${data.commentId}/commentfiles/${data.commentFileId}/complete`,
    {},
    { originalName: data.originalName, name: data.name, relativePath: data.relativePath }
  )
}

// ---------------------------------------- Instruction File Upload Operations ------------------------------------------

/**
 * Create presigned URL for instruction file upload
 */
export const createInstructionFileUploadUrl = (data: {
  orgId: string
  projectId: string
  originalName: string
  type: string
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/instructions/upload-url`,
    {},
    { originalName: data.originalName, type: data.type }
  )
}

/**
 * Upload project instruction file
 */
export const uploadProjectInstructionFile = (data: {
  orgId: string
  projectId: string
  fileId: string
  url: string
  uploadFile: File
  storage: StorageType
}) => {
  if (data.storage === 'default') {
    const formData = new FormData()
    formData.append('file', data.uploadFile)
    return queryMutator(
      'PUT',
      `/orgs/${data.orgId}/projects/${data.projectId}/instructions/${data.fileId}/upload`,
      {},
      formData
    )
  }

  const headers: { [header: string]: string } = {}
  if (data.storage === 'aws') {
    headers['Content-Type'] = data.uploadFile.type
  }

  if (data.storage === 'azure') {
    headers['x-ms-blob-type'] = 'BlockBlob'
  }

  return getNotAuthAxios().put(data.url, data.uploadFile, { headers })
}

// ---------------------------------------- Project Operations (Server-dependent) ------------------------------------------

/**
 * Create a new project - requires server for cloud storage setup
 */
export const createProjectMutator = (data: {
  projectName: string
  orgId: string
  storage: string
  taskType: string
  azureStorageAccount?: string
  azurePassKey?: string
  azureContainerName?: string
  awsSecretAccessKey?: string
  awsAccessKeyId?: string
  awsRegion?: string
  awsApiVersion?: string
  awsBucketName?: string
}) => {
  const { orgId, ...otherDetails } = data
  return queryMutator(
    'POST',
    `/orgs/${orgId}/projects`,
    {},
    { ...otherDetails, name: otherDetails.projectName }
  )
}

/**
 * Sync project with cloud storage
 */
export const syncProject = (data: { orgId: string; projectId: string }) => {
  return queryMutator('POST', `/orgs/${data.orgId}/projects/${data.projectId}/sync`)
}

/**
 * Revert images assigned to a user
 */
export const revertImages = (data: { orgId: string; projectId: string; userId: string }) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/revert`,
    {},
    { userId: data.userId }
  )
}

// ---------------------------------------- Comment Operations ------------------------------------------

/**
 * Fetch comment files - still using server endpoint
 */
export const fetchCommentFiles = async ({
  orgId,
  projectId,
  fileId,
  commentId
}: {
  orgId: string
  projectId: string
  fileId: string
  commentId: string
}) => {
  return queryFetcher(
    `/orgs/${orgId}/projects/${projectId}/files/${fileId}/comments/${commentId}/commentfiles`,
    {}
  )
}
