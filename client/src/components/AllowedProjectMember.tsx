import { useProjectStore } from '@renderer/store/project.store'
import { useUserStore } from '@renderer/store/user.store'
import { FC, Fragment, ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'

type AllowedProjectMembersProps = {
  children: ReactNode
  allowed: ('dataManager' | 'reviewer' | 'annotator')[]
}
const AllowedProjectMembers: FC<AllowedProjectMembersProps> = ({ children, allowed }) => {
  const user = useUserStore((s) => s.user)
  const { projectid: projectId } = useParams()

  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)
  if (!project || !user) {
    return <Navigate to="/" />
  }

  let show = false
  if (allowed.length === 0) {
    show = true
  } else if (allowed.includes('dataManager') && project.dataManagers.includes(user.id)) {
    show = true
  } else if (allowed.includes('reviewer') && project.reviewers.includes(user.id)) {
    show = true
  } else if (allowed.includes('annotator') && project.annotators.includes(user.id)) {
    show = true
  }

  if (!show) {
    return <Navigate to="/" />
  }

  return <Fragment>{children}</Fragment>
}

export default AllowedProjectMembers
