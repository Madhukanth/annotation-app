/**
 * Annotation Class Types
 * Tag/class definitions used for categorizing annotations
 */

export interface AnnotationClass {
  id: string
  name: string
  notes: string
  attributes: string[]
  text: boolean
  ID: boolean
  orgId: string
  projectId: string
  color: string
  createdAt: string
  modifiedAt: string
}
