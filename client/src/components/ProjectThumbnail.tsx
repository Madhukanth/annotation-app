import ProjectType from '@models/Project.model'
import { FC } from 'react'

type ProjectThumbnailProps = { project: ProjectType }
const ProjectThumbnail: FC<ProjectThumbnailProps> = ({ project }) => {
  let src = project.thumbnail
  if (!project.storage || project.storage === 'default') {
    src = `${import.meta.env.VITE_SERVER_ENDPOINT}/static/${project.thumbnail}`
  }

  return <img className="h-52 object-cover w-full rounded-t-md" src={src} />
}

export default ProjectThumbnail
