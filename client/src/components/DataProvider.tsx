import { useFilesStore } from '@renderer/store/files.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { useProjectStore } from '@renderer/store/project.store'
import { FC, ReactNode, useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import Loader from './common/Loader'
import { useProjects } from '@/hooks/useProjects'
import { filesService } from '@/services/supabase'
import { transformFileToLegacy, transformProjectToLegacy } from '@/utils/transformers'

const DataProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { orgid: orgId, projectid: projectId } = useParams()
  const [searchParams] = useSearchParams()
  const limit = Number(searchParams.get('limit') || 20)
  const skip = Number(searchParams.get('skip') || 0)

  const setProjects = useProjectStore((s) => s.setProjects)
  const setFiles = useFilesStore((s) => s.setFiles)
  const [fetchingProjects, setFetchingProjects] = useState(true)
  const [fetchingFiles, setFetchingFiles] = useState(true)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)

  // Fetch projects using Supabase
  const { data: projectsData, isFetched: projectsFetched } = useProjects(orgId || '')

  useEffect(() => {
    if (orgId) {
      setSelectedOrg(orgId)
    }
  }, [orgId, setSelectedOrg])

  useEffect(() => {
    if (!projectsFetched) return

    if (projectsData) {
      setProjects(projectsData.map(transformProjectToLegacy))
    }
    setFetchingProjects(false)

    if (!projectId) {
      setFetchingFiles(false)
    } else {
      // Fetch files for the project
      const fetchFiles = async () => {
        try {
          const { files } = await filesService.getFilesWithCount(projectId, skip, limit, {
            complete: false
          })
          setFiles(files.map(transformFileToLegacy))
        } catch (error) {
          console.error('Error fetching files:', error)
        } finally {
          setFetchingFiles(false)
        }
      }
      fetchFiles()
    }
  }, [projectsData, projectsFetched, setProjects, projectId, skip, limit, setFiles])

  if (!orgId) {
    return <Navigate to="/not-found" />
  }

  if (fetchingProjects || fetchingFiles) {
    return <Loader />
  }

  return <>{children}</>
}

export default DataProvider
