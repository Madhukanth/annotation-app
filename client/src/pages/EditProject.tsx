import { FC, Fragment, useCallback, useEffect, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { HiOutlineUpload } from 'react-icons/hi'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { useDropzone } from 'react-dropzone'

import { useUpdateProject } from '@/hooks/useProjects'
import { useOrgStore } from '@renderer/store/organization.store'
import { SIDEBAR_WIDTH } from '@renderer/constants'
import {
  errorNotification,
  successNotification,
  warningNotification
} from '@renderer/components/common/Notification'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@renderer/components/common/Button'
import { useProjectStore } from '@renderer/store/project.store'
import { FileType } from '@/lib/supabase'
import { filesService, storageService } from '@/services/supabase'

const EditProject: FC = () => {
  const { projectid: projectId } = useParams()
  const getProjectById = useProjectStore((s) => s.getProjectById)
  const fProject = getProjectById(projectId!)
  const [files, setFiles] = useState<File[]>([])
  const [name, setName] = useState('')
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({})
  const [uploading, setUploading] = useState(false)
  const orgId = useOrgStore((s) => s.selectedOrg)
  const navigate = useNavigate()
  const { mutateAsync: updateProjectMutate } = useUpdateProject()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((v) => [...v, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } })

  useEffect(() => {
    if (!projectId || !fProject) return

    setName(fProject.name)
  }, [projectId])

  const saveProject = useCallback(async () => {
    if (!orgId || !projectId || !fProject) return

    if (name.trim().length === 0) {
      warningNotification('Project name field is required')
      return
    }

    const progressObj: { [fileName: string]: number } = {}
    for (const file of files) {
      progressObj[file.name] = 0
    }
    setUploadProgress(progressObj)
    setUploading(true)

    try {
      // Update project name
      await updateProjectMutate({ projectId, input: { name } })

      const failedFiles: File[] = []

      // Upload files directly to Supabase Storage and create file records
      for (const file of files) {
        try {
          // Upload file directly to Supabase Storage
          const uploadResult = await storageService.uploadFileToStorage({
            orgId: orgId,
            projectId: projectId,
            file: file,
            onProgress: (percent) => {
              setUploadProgress((prgs) => ({ ...prgs, [file.name]: percent }))
            }
          })

          // Determine file type
          const fileType: FileType = file.type.startsWith('video') ? 'video' : 'image'

          // Get video metadata if needed
          const info = { totalFrames: 1, fps: 1, duration: 0 }
          if (fileType === 'video') {
            // Default video values - in production you might want to extract these
            info.fps = 24
            info.totalFrames = 4800
            info.duration = 200
          }

          // Create file record directly in Supabase database
          await filesService.createFile({
            id: uploadResult.fileId,
            originalName: file.name,
            name: uploadResult.path.split('/').pop() || file.name,
            url: uploadResult.url,
            relativePath: uploadResult.path,
            storedIn: 'default',
            orgId: orgId,
            projectId: projectId,
            type: fileType,
            totalFrames: info.totalFrames,
            fps: info.fps,
            duration: info.duration
          })
        } catch (e) {
          console.error(`Failed to upload ${file.name}:`, e)
          failedFiles.push(file)
        }
      }

      setUploading(false)
      if (failedFiles.length > 0) {
        setFiles(failedFiles)
        errorNotification(`Failed to upload ${failedFiles.length} file(s)`)
      } else {
        successNotification('Successfully uploaded')
        navigate(`/orgs/${orgId}/projects`)
      }
    } catch (error) {
      console.error('Error updating project:', error)
      setUploading(false)
      errorNotification('Failed to update project')
    }
  }, [orgId, name, files, projectId, fProject, navigate])

  const deleteFile = (fileName: string) => {
    setFiles((v) => v.filter((f) => f.name !== fileName))
  }

  return (
    <Fragment>
      <div className="grid h-[calc(100%-80px)]" style={{ gridTemplateRows: '70px 1fr' }}>
        <div className="py-4 px-4 row-span-1 max-h-20">
          <p className="text-2xl">Edit Project</p>
        </div>

        <div className="flex flex-col mx-4 py-6 px-10 bg-white rounded-t-lg overflow-y-scroll">
          <label className="text-gray-400 text-base flex-grow-0 flex-shrink-0" htmlFor="email">
            Project Name<sup>*</sup>
          </label>
          <input
            placeholder=""
            className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
            name="name"
            type="text"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />

          <div
            {...getRootProps()}
            className="cursor-pointer flex-grow-0 flex-shrink-0 mt-8 p-2 h-44 w-full border border-dashed border-font-0.14 rounded-md flex justify-center items-center text-gray-600"
          >
            <input {...getInputProps()} />
            <div>
              <HiOutlineUpload className="mx-auto text-brand" size={35} />
              <p>Select Files</p>
              <p className="text-sm opacity-70">.jpg, .jpeg, .png</p>
            </div>
          </div>

          <div className="flex-grow mt-8 grid grid-cols-6 gap-6">
            {files.map((file) => (
              <div className="relative rounded-md border border-font-0.14 h-fit" key={file.name}>
                {!uploading && (
                  <button
                    onClick={() => deleteFile(file.name)}
                    className="absolute text-white bg-red-500 z-30 -top-2 -right-2 rounded-full"
                  >
                    <IoClose size={20} />
                  </button>
                )}

                <img
                  className="rounded-t-md h-44 w-full object-cover"
                  src={URL.createObjectURL(file)}
                />
                <div className="w-full p-2 text-center overflow-hidden">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">{file.name}</p>
                </div>

                {uploading && (
                  <div className="absolute rounded-md bg-[rgba(0,0,0,0.5)] top-0 right-0 bottom-0 left-0 z-20 h-full w-full">
                    <CircularProgressbar
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-15 h-15"
                      value={uploadProgress[file.name] || 0}
                      text={`${uploadProgress[file.name] || 0}%`}
                      styles={buildStyles({
                        pathColor: '#3FB8F7',
                        textColor: '#3FB8F7',
                        textSize: 25
                      })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{ left: `${SIDEBAR_WIDTH}px` }}
        className="bg-white px-8 flex items-center justify-end fixed bottom-0 h-20 right-0 shadow-inner"
      >
        <Button
          link
          to={`/orgs/${orgId}/projects`}
          className="mr-6 py-2 bg-transparent text-button-cancel"
        >
          Cancel
        </Button>

        <button
          disabled={uploading}
          onClick={saveProject}
          type="button"
          className="py-2 px-4 bg-brand rounded-md text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </Fragment>
  )
}

export default EditProject
