import AnnotationType from './Annotation.model'
import AnnotationClass from './AnnotationClass.model'
import { Storage } from './Project.model'

type FileType = {
  id: string
  originalName: string
  relativePath: string
  name: string
  orgId: string
  projectId: string
  url: string
  type: 'image'
  metadata: AnnotationType
  annotators: string[]
  reviewers: string[]
  createdAt: string
  complete: boolean
  stageScale: number
  storedIn: Storage
  tags: AnnotationClass[]
  dbIndex: number
  skipped: boolean
}

export default FileType
