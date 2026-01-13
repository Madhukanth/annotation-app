import ProjectType from '@models/Project.model'
import { FC } from 'react'

type ProjectThumbnailProps = { project: ProjectType }
const ProjectThumbnail: FC<ProjectThumbnailProps> = ({ project }) => {
  return <img className="h-52 object-cover w-full rounded-t-md" src={project.thumbnail} />
}

export default ProjectThumbnail
