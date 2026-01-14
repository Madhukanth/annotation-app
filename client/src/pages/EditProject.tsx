import { FC, Fragment, useCallback, useEffect, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useMutation } from '@tanstack/react-query'
import { HiOutlineUpload } from 'react-icons/hi'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { useDropzone } from 'react-dropzone'

import {
  completeFileUpload,
  createFileUploadUrl,
  uploadFileMutator
} from '@renderer/helpers/axiosRequests'
import { useUpdateProject } from '@/hooks/useProjects'
import { useOrgStore } from '@renderer/store/organization.store'
import { SIDEBAR_WIDTH } from '@renderer/constants'
import {
  errorNotification,
  successNotification,
  warningNotification
} from '@/components/ui/Notification'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useProjectStore } from '@renderer/store/project.store'
import { FileTypesType } from '@models/File.model'
// import { VideoMetadataModel } from '@models/video_metadata.model'

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
  const { mutateAsync: uploadFileMutate } = useMutation(uploadFileMutator)
  const { mutateAsync: updateProjectMutate } = useUpdateProject()
  const { mutateAsync: createFileUploadUrlMutate } = useMutation(createFileUploadUrl)
  const { mutateAsync: completeFileUploadMutate } = useMutation(completeFileUpload)

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

    if (files.length === 0) {
      warningNotification('Please select at least one file to upload')
      return
    }

    const progressObj: { [fileName: string]: number } = {}
    for (const file of files) {
      progressObj[file.name] = 0
    }
    setUploadProgress(progressObj)
    setUploading(true)

    await updateProjectMutate({ projectId, input: { name } })

    const failedFiles: File[] = []
    for (const file of files) {
      try {
        const createUrlData = await createFileUploadUrlMutate({
          orgId: orgId,
          projectId: projectId,
          originalName: file.name,
          type: file.type
        })

        await uploadFileMutate({
          storage: fProject.storage,
          url: createUrlData.uploadUrl,
          orgId: orgId,
          projectId: projectId,
          uploadFile: file,
          onProgress: (percent) => {
            setUploadProgress((prgs) => ({ ...prgs, [file.name]: percent }))
          }
        })

        const info = { totalFrames: 1, fps: 1, duration: 0 }
        const fileType: FileTypesType = file.type.startsWith('video') ? 'video' : 'image'
        if (fileType === 'video') {
          // const { framescount, fps, duration } =
          //   await window.api.fileApi.getVideoMetadata<VideoMetadataModel>(file.filePath)
          info.fps = 24
          info.totalFrames = 4800
          info.duration = 200
        }

        await completeFileUploadMutate({
          orgId: orgId,
          projectId: projectId,
          fileId: createUrlData.fileId,
          relativePath: createUrlData.relativePath,
          name: createUrlData.name,
          originalName: createUrlData.updatedOriginalName,
          totalFrames: info.totalFrames,
          fps: info.fps,
          duration: info.duration,
          type: fileType
        })
      } catch (e) {
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
  }, [orgId, name, files, projectId, fProject])

  const deleteFile = (fileName: string) => {
    setFiles((v) => v.filter((f) => f.name !== fileName))
  }

  return (
    <Fragment>
      <div className="grid h-[calc(100%-80px)]" style={{ gridTemplateRows: '70px 1fr' }}>
        <div className="py-4 px-4 row-span-1 max-h-20">
          <p className="text-2xl">Add Project</p>
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
