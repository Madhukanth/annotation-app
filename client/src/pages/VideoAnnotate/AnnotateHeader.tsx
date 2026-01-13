import { FC } from 'react'
import { useParams } from 'react-router-dom'
import { BsFillCheckCircleFill } from 'react-icons/bs'

import Button from '@renderer/components/common/Button'
import { useProjectStore } from '@renderer/store/project.store'
import { useMutation } from '@tanstack/react-query'
import { filesService } from '@/services/supabase'
import { useFilesStore } from '@renderer/store/files.store'
import { errorNotification } from '@renderer/components/common/Notification'

const AnnotateHeader: FC = () => {
  const { projectid: projectId } = useParams()

  const getProjectById = useProjectStore((s) => s.getProjectById)
  const updateFileStore = useFilesStore((s) => s.updateFile)

  const project = getProjectById(projectId || '')
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  const updateFileMutation = useMutation({
    mutationFn: ({ fileId, data }: { fileId: string; data: { complete?: boolean; skipped?: boolean } }) =>
      filesService.updateFile(fileId, data),
    onSuccess(_data, { data }) {
      updateFileStore(fileId!, { complete: data.complete })
    },
    onError() {
      errorNotification('Failed to update')
    }
  })

  const handleComplete = (status: boolean) => {
    if (!fileId) return
    updateFileMutation.mutate({
      fileId: fileId,
      data: { complete: status }
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

      {fileObj && !fileObj.complete && (
        <Button onClick={() => handleComplete(true)} disabled={updateFileMutation.isLoading} className="h-full">
          Complete
        </Button>
      )}

      {fileObj && fileObj.complete && (
        <Button onClick={() => handleComplete(false)} disabled={updateFileMutation.isLoading} className="h-full">
          Mark InComplete
        </Button>
      )}
    </div>
  )
}

export default AnnotateHeader
