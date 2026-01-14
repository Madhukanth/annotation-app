import { useQuery } from '@tanstack/react-query'
import { FC, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import Pagination from '@/components/ui/Pagination'
import { filesService } from '@/services/supabase'
import { useFilesStore } from '@renderer/store/files.store'
import { useOrgStore } from '@renderer/store/organization.store'
import FileType from '@renderer/models/File.model'

const ImagePagination: FC = () => {
  const selectedOrg = useOrgStore((s) => s.selectedOrg)
  const currentPage = useFilesStore((s) => s.currentPage)
  const setCurrentPage = useFilesStore((s) => s.setCurrentPage)
  const setCount = useFilesStore((s) => s.setCount)
  const setFiles = useFilesStore((s) => s.setFiles)

  const { projectid: projectId } = useParams()

  const limit = 20
  const skip = currentPage * limit
  const { data } = useQuery({
    queryKey: ['project-files', { projectId: projectId!, skip, limit, complete: false }],
    queryFn: () => filesService.getFilesWithCount(projectId!, skip, limit, { complete: false }),
    initialData: { files: [], count: 0 },
    enabled: !!selectedOrg && !!projectId
  })
  const totalPages = Math.ceil(data.count / limit)

  useEffect(() => {
    setCount(data.count)
  }, [data.count])

  useEffect(() => {
    setFiles(data.files as unknown as FileType[])
  }, [data.files])

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={({ selected }) => {
        setCurrentPage(selected)
      }}
    />
  )
}

export default ImagePagination
