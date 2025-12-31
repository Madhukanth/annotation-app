import axios, { AxiosRequestConfig, GenericAbortSignal, Method } from 'axios'
import { QueryFunction } from '@tanstack/react-query'

import { InvitationType } from '@models/Invitation.model'
import OrganizationType from '@models/Organization.model'
import ProjectType, { Storage } from '@models/Project.model'
import {
  InviteRoleType,
  InviteStatusType,
  UserRoleType,
  UserType
} from '@renderer/store/user.store'
import AnnotationType from '@models/Annotation.model'
import FileType, { FileTypesType } from '@models/File.model'
import { ActionNameType } from '@models/Action.model'
import CommentType from '@models/Comment.model'
import { CommentFile } from '@models/CommentFile.model'
import AnnotationClass from '@models/AnnotationClass.model'
import { ShapeType } from '@models/Shape.model'
import { clearAuthTokenFromCookie } from './cookie'

export const setAxiosDefaults = () => {
  axios.defaults.baseURL = import.meta.env.VITE_SERVER_ENDPOINT

  axios.interceptors.response.use(
    (response) => {
      // Any status code that falls within the range of 2xx will trigger this function
      // Do something with the successful response data
      return response // Don't forget to return the response
    },
    (error) => {
      // Any status codes that fall outside the range of 2xx will trigger this function
      // Do something with the error response
      console.error('Error response:', error.response)
      // You can perform custom error handling, such as redirecting to login page on 401
      if (error.response && error.response.status === 401) {
        // Redirect to login or handle token refresh
        setAuthToken(null)
        clearAuthTokenFromCookie()
        window.location.href = '/login'
      }

      // You can also throw the error again if you want it to propagate to your app
      return Promise.reject(error)
    }
  )
}

export const setAuthToken = (token: string | null = null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }
}

export const getNotAuthAxios = () => {
  const instance = axios.create()
  delete instance.defaults.headers.common['Authorization']
  return instance
}

export const queryFetcher = async (
  url: string,
  queryParams?: { [key: string]: string },
  config?: AxiosRequestConfig,
  signal?: GenericAbortSignal
) => {
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

// ---------------------------------------- Queries ------------------------------------------
export const searchUsers = (searchTerm: string): Promise<UserType[]> => {
  return queryFetcher('/users', { email: searchTerm })
}

export const searchTags = (
  orgId: string,
  projectId: string,
  queryParams: {
    skip: string
    limit: string
    name?: string
  }
) => {
  return queryFetcher(`/orgs/${orgId}/projects/${projectId}/annotationclasses`, queryParams)
}

export const fetchOrganization: QueryFunction<OrganizationType[], [string, { userId: string }]> = ({
  queryKey,
  signal
}) => {
  const [, { userId }] = queryKey
  return queryFetcher('/orgs', { userid: userId }, undefined, signal)
}

export const fetchProjects: QueryFunction<
  { projects: ProjectType[]; count: number },
  [string, { orgId: string; userId: string; limit: number; skip: number }]
> = ({ queryKey, signal }) => {
  const [, { orgId, userId, limit, skip }] = queryKey
  return queryFetcher(
    `/orgs/${orgId}/projects`,
    { userid: userId, limit: limit.toString(), skip: skip.toString() },
    undefined,
    signal
  )
}

export const fetchPendingInvites: QueryFunction<
  InvitationType[],
  [string, { status: InviteStatusType; inviterId: string; projectId: string; orgId: string }]
> = ({ queryKey, signal }) => {
  const [, { status, inviterId, orgId, projectId }] = queryKey
  return queryFetcher(
    `/orgs/${orgId}/projects/${projectId}/invitation`,
    { status, inviterid: inviterId, projectid: projectId },
    undefined,
    signal
  )
}

export const fetchReceivedInvites: QueryFunction<
  InvitationType[],
  [string, { userId: string }]
> = ({ queryKey, signal }) => {
  const [, { userId }] = queryKey
  return queryFetcher(`/users/${userId}/invites`, undefined, undefined, signal)
}

export const fetchProjectUsers: QueryFunction<
  {
    dataManagers: UserType[]
    annotators: UserType[]
    reviewers: UserType[]
  },
  [string, { orgId: string; projectId: string }]
> = ({ queryKey, signal }) => {
  const [, { projectId, orgId }] = queryKey
  return queryFetcher(`/orgs/${orgId}/projects/${projectId}/users`, undefined, undefined, signal)
}

export const fetchProjectFiles: QueryFunction<
  { files: FileType[]; count: number },
  [
    string,
    {
      orgId: string
      projectId: string
      limit: number
      skip?: number
      hasShapes?: boolean
      complete?: boolean
      annotator?: string
      completedAfter?: Date
      skippedAfter?: Date
      skipped?: boolean
      skipFileIds?: string[]
      tags?: string[]
    }
  ]
> = ({ queryKey, signal }) => {
  const [
    ,
    {
      projectId,
      orgId,
      skip = 0,
      hasShapes,
      complete,
      limit,
      tags,
      annotator,
      completedAfter,
      skippedAfter,
      skipped,
      skipFileIds
    }
  ] = queryKey
  const queryParams: { [query: string]: string } = {
    skip: skip.toString(),
    limit: limit.toString(),
    ...(complete !== undefined && { complete: complete.toString() }),
    ...(annotator && { annotator: annotator }),
    ...(completedAfter && { completedAfter: completedAfter.toISOString() }),
    ...(skippedAfter && { skippedAfter: skippedAfter.toISOString() }),
    ...(hasShapes !== undefined && { hasShapes: hasShapes.toString() }),
    ...(skipped !== undefined && { skipped: skipped.toString() }),
    ...(skipFileIds && { skipFileIds: skipFileIds.join(',') })
  }
  if (tags) {
    if (typeof tags === 'string') {
      queryParams['tags'] = tags
    } else {
      queryParams['tags'] = tags.join(',')
    }
  }

  return queryFetcher(
    `/orgs/${orgId}/projects/${projectId}/files`,
    { ...queryParams },
    undefined,
    signal
  )
}

export const fetchProjectBasicInfo: QueryFunction<
  { files: number; completed: number; skipped: number; remaining: number },
  [string, { orgId: string; projectId: string }]
> = ({ queryKey, signal }) => {
  const [, { projectId, orgId }] = queryKey
  return queryFetcher(`/orgs/${orgId}/projects/${projectId}/info`, undefined, undefined, signal)
}

export const fetchUserStats: QueryFunction<
  {
    start: string
    end: string
    completed: number
    skipped: number
  }[],
  [string, { orgId: string; projectId: string; userId: string; lastdays: string }]
> = ({ queryKey, signal }) => {
  const [, { orgId, projectId, userId, lastdays }] = queryKey
  return queryFetcher(
    `/orgs/${orgId}/projects/${projectId}/users/${userId}/stats`,
    { lastdays },
    undefined,
    signal
  )
}

export const fetchComments: QueryFunction<
  CommentType[],
  [string, { orgId: string; projectId: string; fileId: string; shapeId: string | undefined }]
> = ({ queryKey, signal }) => {
  const [, { orgId, projectId, fileId, shapeId }] = queryKey
  const queryParams: { [shapeId: string]: string } = {}
  if (shapeId) {
    queryParams['shapeId'] = shapeId
  }

  return queryFetcher(
    `/orgs/${orgId}/projects/${projectId}/files/${fileId}/comments`,
    { ...queryParams },
    undefined,
    signal
  )
}

export const fetchCommentFiles: QueryFunction<
  CommentFile[],
  [string, { orgId: string; projectId: string; fileId: string; commentId: string }]
> = ({ queryKey, signal }) => {
  const [, { orgId, projectId, fileId, commentId }] = queryKey
  return queryFetcher(
    `/orgs/${orgId}/projects/${projectId}/files/${fileId}/comments/${commentId}/commentfiles`,
    {},
    undefined,
    signal
  )
}

export const fetchProjectById: QueryFunction<
  ProjectType,
  [string, { orgId: string; projectId: string }]
> = ({ queryKey, signal }) => {
  const [, { orgId, projectId }] = queryKey
  return queryFetcher(`/orgs/${orgId}/projects/${projectId}`, {}, undefined, signal)
}

export const fetchAnnotationClasses: QueryFunction<
  AnnotationClass[],
  [string, { orgId: string; projectId: string }]
> = ({ queryKey, signal }) => {
  const [, { orgId, projectId }] = queryKey
  return queryFetcher(
    `/orgs/${orgId}/projects/${projectId}/annotationclasses`,
    {},
    undefined,
    signal
  )
}

export const fetchUsers: QueryFunction<UserType[], [string, { orgId: string }]> = ({
  queryKey,
  signal
}) => {
  const [, { orgId }] = queryKey
  return queryFetcher(`/users`, { orgId }, undefined, signal)
}

export const getProjectStats: QueryFunction<
  {
    userId: string
    userName: string
    assignedCount: number
    completedCount: number
    skippedCount: number
    remainingCount: number
  }[],
  [string, { orgId: string; projectId: string }]
> = ({ queryKey, signal }) => {
  const [, { orgId, projectId }] = queryKey
  return queryFetcher(`/orgs/${orgId}/projects/${projectId}/stats`, {}, undefined, signal)
}

// ---------------------------------------- Mutators ------------------------------------------

export const loginUser = (data: { email: string; password: string }) => {
  return queryMutator('POST', '/auth/login', {}, data)
}

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

export const updateProjectMutator = (data: {
  projectId: string
  projectName: string
  orgId: string
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}`,
    {},
    { name: data.projectName }
  )
}

export const inviteUserToProject = (data: {
  orgId: string
  projectId: string
  inviterId: string
  invitees: string[]
  role: InviteRoleType
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/invitation`,
    {},
    { inviter: data.inviterId, invitees: data.invitees, role: data.role }
  )
}

export const addMemberToProject = (data: {
  orgId: string
  projectId: string
  userIds: string[]
  role: InviteRoleType
}) => {
  const members = data.userIds.map((userId) => ({ userId, role: data.role }))
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/add-members`,
    {},
    members
  )
}

export const updateInvite = (data: {
  orgId: string
  projectId: string
  inviteId: string
  status: InviteStatusType
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/invitation/${data.inviteId}`,
    {},
    { status: data.status }
  )
}

export const deleteInvite = (data: { orgId: string; projectId: string; inviteId: string }) => {
  return queryMutator(
    'DELETE',
    `/orgs/${data.orgId}/projects/${data.projectId}/invitation/${data.inviteId}`
  )
}

export const removeUserFromProject = (data: {
  orgId: string
  projectId: string
  userId: string
}) => {
  return queryMutator(
    'DELETE',
    `/orgs/${data.orgId}/projects/${data.projectId}/users/${data.userId}`
  )
}

export const updateFileMetadata = (data: {
  orgId: string
  projectId: string
  fileId: string
  metadata: AnnotationType
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}`,
    {},
    { metadata: data.metadata }
  )
}

export const updateFileTags = (data: {
  orgId: string
  projectId: string
  fileId: string
  tags: string[]
}) => {
  const { orgId, projectId, fileId, ...otherData } = data
  return queryMutator(
    'PATCH',
    `/orgs/${orgId}/projects/${projectId}/files/${fileId}`,
    {},
    { ...otherData }
  )
}

export const updateFileListTag = (data: {
  orgId: string
  projectId: string
  fileIds: string[]
  tagIds: string[]
}) => {
  const { orgId, projectId, ...otherData } = data
  return queryMutator(
    'PATCH',
    `/orgs/${orgId}/projects/${projectId}/files/associate-tags`,
    {},
    { ...otherData }
  )
}

export const updateFileCompleteStatus = (data: {
  orgId: string
  projectId: string
  fileId: string
  complete: boolean
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}`,
    {},
    { complete: data.complete }
  )
}

export const updateFileHeightWidth = (data: {
  orgId: string
  projectId: string
  fileId: string
  height: number
  width: number
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}`,
    {},
    { height: data.height, width: data.width }
  )
}

export const updateFileSkippedStatus = (data: {
  orgId: string
  projectId: string
  fileId: string
  skipped: boolean
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}`,
    {},
    { skipped: data.skipped }
  )
}

export const deleteProject = (data: { orgId: string; projectId: string }) => {
  return queryMutator('DELETE', `/orgs/${data.orgId}/projects/${data.projectId}`)
}

export const deleteFile = (data: { orgId: string; projectId: string; fileId: string }) => {
  return queryMutator(
    'DELETE',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}`
  )
}

export const createAction = (data: {
  orgId: string
  projectId: string
  fileId: string
  name: ActionNameType
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/actions`,
    {},
    { name: data.name }
  )
}

export const createComment = (data: {
  orgId: string
  projectId: string
  fileId: string
  content: string
  shapeId?: string
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/comments`,
    {},
    { content: data.content, shapeId: data.shapeId }
  )
}

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

export const uploadCommentFile = (data: {
  orgId: string
  projectId: string
  fileId: string
  commentId: string
  commentFileId: string
  url: string
  uploadFile: File
  storage: Storage
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

export const updateProject = (data: { orgId: string; projectId: string; instructions: string }) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}`,
    {},
    { instructions: data.instructions }
  )
}

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

export const uploadProjectInstructionFile = (data: {
  orgId: string
  projectId: string
  fileId: string
  url: string
  uploadFile: File
  storage: Storage
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

export const createAnnotationClass = (data: {
  orgId: string
  projectId: string
  name: string
  attributes: string[]
  text: boolean
  ID: boolean
  color: string
  notes: string
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/annotationclasses`,
    {},
    {
      name: data.name,
      attributes: data.attributes,
      text: data.text,
      ID: data.ID,
      color: data.color,
      notes: data.notes
    }
  )
}

export const updateAnnotationClass = (
  data: Omit<Omit<AnnotationClass, 'createdAt'>, 'modifiedAt'>
) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/annotationclasses/${data.id}`,
    {},
    {
      name: data.name,
      attributes: data.attributes,
      text: data.text,
      ID: data.ID,
      color: data.color,
      notes: data.notes
    }
  )
}

export const deleteAnnotationClass = (data: {
  orgId: string
  projectId: string
  classId: string
}) => {
  return queryMutator(
    'DELETE',
    `/orgs/${data.orgId}/projects/${data.projectId}/annotationclasses/${data.classId}`
  )
}

export const createShape = (data: {
  orgId: string
  projectId: string
  fileId: string
  shape: Omit<ShapeType, 'id'>
}) => {
  return queryMutator(
    'POST',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/shapes`,
    {},
    { ...data.shape }
  )
}

export const updateShape = (data: {
  orgId: string
  projectId: string
  fileId: string
  shapeId: string
  shape: Partial<ShapeType>
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/shapes/${data.shapeId}`,
    {},
    { ...data.shape }
  )
}

export const deleteShape = (data: {
  orgId: string
  projectId: string
  fileId: string
  shapeId: string
}) => {
  return queryMutator(
    'DELETE',
    `/orgs/${data.orgId}/projects/${data.projectId}/files/${data.fileId}/shapes/${data.shapeId}`
  )
}

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

export const uploadFileMutator = (data: {
  url: string
  uploadFile: File
  projectId: string
  orgId: string
  storage: Storage
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

export const syncProject = (data: { orgId: string; projectId: string }) => {
  return queryMutator('POST', `/orgs/${data.orgId}/projects/${data.projectId}/sync`)
}

export const updateProjectDefaultClass = (data: {
  orgId: string
  projectId: string
  classId: string
}) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}`,
    {},
    { defaultClassId: data.classId }
  )
}

export const registerUser = (data: {
  email: string
  password: string
  name: string
  role: UserRoleType
  orgId: string
}) => {
  return queryMutator('POST', '/auth/signup', {}, data)
}

export const updateUser = (data: {
  userId: string
  updateData: {
    email: string
    password?: string
    name: string
    role: UserRoleType
    orgId: string
  }
}) => {
  return queryMutator('PATCH', `/users/${data.userId}`, {}, data.updateData)
}

export const deleteUser = (userId: string) => {
  return queryMutator('DELETE', `/users/${userId}`)
}

export const revertImages = (data: { orgId: string; projectId: string; userId: string }) => {
  return queryMutator(
    'PATCH',
    `/orgs/${data.orgId}/projects/${data.projectId}/revert`,
    {},
    { userId: data.userId }
  )
}
