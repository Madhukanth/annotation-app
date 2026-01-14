/**
 * Organization Types
 * Organization entity definitions
 */

export interface Organization {
  id: string
  name: string
  orgadmin?: string
  users?: string[]
  projects?: string[]
  createdAt?: string
  modifiedAt?: string
}
