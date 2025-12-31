import { fetchProjectFiles, fetchProjects } from '@renderer/helpers/axiosRequests'

import { useFilesStore } from '@renderer/store/files.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { useProjectStore } from '@renderer/store/project.store'
import { useUserStore } from '@renderer/store/user.store'
import { useQuery } from '@tanstack/react-query'
import { FC, ReactNode, useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import Loader from './common/Loader'

const LoadData: FC<{ children: ReactNode }> = ({ children }) => {
  const { orgid: orgId, projectid: projectId } = useParams()
  const [searchParams] = useSearchParams()
  const limit = Number(searchParams.get('limit'))
  const skip = Number(searchParams.get('skip'))
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)

  const user = useUserStore((s) => s.user)
  const projects = useProjectStore((s) => s.projects)
  const setProjects = useProjectStore((s) => s.setProjects)
  const setFiles = useFilesStore((s) => s.setFiles)
  const [fetchingProjects, setFetchingProjects] = useState(true)
  const [fetchingFiles, setFetchingFiles] = useState(true)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)

  const {
    data: projectsData,
    refetch: refetchProjects,
    isFetched: projectsSuccess
  } = useQuery(
    ['projects', { orgId: orgId!, userId: user!.id, limit: projectLimit, skip: projectSkip }],
    fetchProjects,
    { initialData: { projects: [], count: 0 }, enabled: false }
  )

  const {
    data: filesData,
    refetch: refetchFiles,
    isFetched: filesSuccess
  } = useQuery(
    [
      'project-files',
      {
        orgId: orgId!,
        projectId: projectId!,
        skip: skip || 0,
        complete: false,
        limit: limit || 20
      }
    ],
    fetchProjectFiles,
    { initialData: { files: [], count: 0 }, enabled: false }
  )

  useEffect(() => {
    if (orgId) {
      setSelectedOrg(orgId)
      refetchProjects()
    }
  }, [orgId, refetchProjects, setSelectedOrg, projectId, projects])

  useEffect(() => {
    if (!projectsSuccess) return

    setProjects(projectsData.projects)
    setFetchingProjects(false)
    if (!projectId) {
      setFetchingFiles(false)
    } else {
      refetchFiles()
    }
  }, [projectsData, setProjects, projectId, projectsSuccess, setFetchingFiles, refetchFiles])

  useEffect(() => {
    if (filesSuccess) {
      setFiles(filesData.files)
      setFetchingFiles(false)
    }
  }, [filesData, setFiles, filesSuccess])

  if (!orgId) {
    return <Navigate to="/not-found" />
  }

  if (fetchingProjects || fetchingFiles) {
    return <Loader />
  }

  return <>{children}</>
}

export default LoadData
