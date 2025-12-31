import AnnotationType from './Annotation.model'
import { VideoMetadataModel } from './video_metadata.model'

export interface VideoModel {
  ext: string
  dir: string
  id: string
  name: string
  notes: string
  absPath: string
  assetPath: string
  createdAt: string
  ctime: string
  mtime: string
  metadata?: VideoMetadataModel
  annotations: AnnotationType
}
