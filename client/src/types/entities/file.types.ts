/**
 * File Types
 * File entity definitions for images and videos
 */

import { Annotation, VideoAnnotation } from './annotation.types'
import { AnnotationClass } from './annotation-class.types'
import { StorageType } from './project.types'

// File type enumeration
export const fileTypes = ['image', 'video'] as const
export type FileTypesType = (typeof fileTypes)[number]

// Base file type (works for both images and videos)
export interface File {
  id: string
  originalName: string
  relativePath: string
  name: string
  orgId: string
  projectId: string
  url: string
  type: FileTypesType
  metadata: Annotation | VideoAnnotation
  annotators: string[]
  reviewers: string[]
  createdAt: string
  complete: boolean
  stageScale: number
  storedIn: StorageType
  tags: AnnotationClass[]
  dbIndex: number
  skipped: boolean
  // Optional video properties (only present when type is 'video')
  fps?: number
  totalFrames?: number
  duration?: number
}

// Video-specific file type
export interface VideoFile {
  id: string
  originalName: string
  relativePath: string
  name: string
  projectId: string
  url: string
  type: 'video'
  metadata: VideoAnnotation
  annotators: string[]
  reviewers: string[]
  createdAt: string
  complete: boolean
  stageScale: number
  storedIn: StorageType
  fps: number
  totalFrames: number
  duration: number
}

// Common video object properties (union-compatible)
export interface VideoObj {
  id: string
  fps?: number
  duration?: number
  totalFrames?: number
}
