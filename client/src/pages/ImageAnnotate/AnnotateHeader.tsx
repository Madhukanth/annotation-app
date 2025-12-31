import { FC } from 'react'
import { useParams } from 'react-router-dom'
import { BsFillCheckCircleFill } from 'react-icons/bs'

import Button from '@renderer/components/common/Button'
import { useProjectStore } from '@renderer/store/project.store'
import { useMutation } from '@tanstack/react-query'
import { updateFileCompleteStatus } from '@renderer/helpers/axiosRequests'
import { useFilesStore } from '@renderer/store/files.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { errorNotification } from '@renderer/components/common/Notification'

const AnnotateHeader: FC = () => {
  const { projectid: projectId } = useParams()
  const selectedOrg = useOrgStore((s) => s.selectedOrg)
  const getProjectById = useProjectStore((s) => s.getProjectById)
  const updateFile = useFilesStore((s) => s.updateFile)

  const project = getProjectById(projectId || '')
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  const { mutate: completeFileMutate, isLoading } = useMutation(updateFileCompleteStatus, {
    onSuccess(_data, { complete }) {
      updateFile(fileId!, { complete })
    },
    onError() {
      errorNotification('Failed to update')
    }
  })

  const handleComplete = (status: boolean) => {
    completeFileMutate({
      orgId: selectedOrg!,
      projectId: projectId!,
      fileId: fileId!,
      complete: status
    })
  }

  return (
    <div className="bg-white rounded-xl p-2 flex items-center justify-between">
      <div className="ml-4 text-lg flex items-center">
        <p className="mr-2 text-gray-400">
          {'Projects >'} {project?.name || ''}
        </p>
        <p className="mr-2 text-gray-400">{'> Files >'}</p>
        <p className="mr-2">{fileObj?.originalName || ''}</p>
        {fileObj?.complete && (
          <div className="text-green-500 ml-2">
            <BsFillCheckCircleFill size={25} />
          </div>
        )}
      </div>

      <div className="flex items-center h-full gap-4">
        {fileObj && !fileObj.complete && (
          <Button onClick={() => handleComplete(true)} disabled={isLoading} className="h-full">
            Complete
          </Button>
        )}

        {fileObj && fileObj.complete && (
          <Button onClick={() => handleComplete(false)} disabled={isLoading} className="h-full">
            Mark InComplete
          </Button>
        )}
      </div>
    </div>
  )
}

export default AnnotateHeader
