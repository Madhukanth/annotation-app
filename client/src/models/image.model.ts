import AnnotationType from './Annotation.model'

export interface ImageModel {
  id: string
  name: string
  absPath: string
  assetPath: string
  dir: string
  ext: string
  createdAt: string
  ctime: string
  mtime: string
  annotations: AnnotationType
}
