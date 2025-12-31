import { FC } from 'react'
import { useParams } from 'react-router-dom'

import { useFilesStore } from '@renderer/store/files.store'
import { useProjectStore } from '@renderer/store/project.store'

const FileInfo: FC = () => {
  const { projectid: projectId } = useParams()

  const getProjectById = useProjectStore((s) => s.getProjectById)
  const project = getProjectById(projectId || '')
  const fileObj = useFilesStore((s) => s.selectedFile)

  return (
    <div className="w-72 rounded-lg bg-white shadow-md p-4 border border-gray-300">
      <p className="opacity-80 text-sm">Project name</p>
      <p className="text-lg">{project?.name || '-'}</p>

      <div className="h-4"></div>

      <p className="opacity-80 text-sm">File name</p>
      <p className="text-lg break-all">{fileObj?.originalName || '-'}</p>

      <div className="h-4"></div>

      <p className="opacity-80 text-sm">Marked as Complete</p>
      <p className="text-lg">{fileObj?.complete ? 'Yes' : 'No'}</p>
    </div>
  )
}

export default FileInfo
