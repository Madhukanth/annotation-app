import AnnotationType, { VideoAnnotationType } from './Annotation.model'
import AnnotationClass from './AnnotationClass.model'
import { Storage } from './Project.model'

const fileTypes = ['image', 'video'] as const
export type FileTypesType = (typeof fileTypes)[number]

type FileType = {
  id: string
  originalName: string
  relativePath: string
  name: string
  orgId: string
  projectId: string
  url: string
  type: 'image' | 'video'
  metadata: AnnotationType | VideoAnnotationType
  annotators: string[]
  reviewers: string[]
  createdAt: string
  complete: boolean
  stageScale: number
  storedIn: Storage
  tags: AnnotationClass[]
  dbIndex: number
  skipped: boolean
  // Optional video properties (only present when type is 'video')
  fps?: number
  totalFrames?: number
  duration?: number
}

export default FileType

export type VideoFileType = {
  id: string
  originalName: string
  relativePath: string
  name: string
  projectId: string
  url: string
  type: 'video'
  metadata: VideoAnnotationType
  annotators: string[]
  reviewers: string[]
  createdAt: string
  complete: boolean
  stageScale: number
  storedIn: Storage
  fps: number
  totalFrames: number
  duration: number
}

// Common video object properties that VideoControls needs (union-compatible with VideoFileType and VideoModel)
export type VideoObjType = {
  id: string
  fps?: number
  duration?: number
  totalFrames?: number
}
