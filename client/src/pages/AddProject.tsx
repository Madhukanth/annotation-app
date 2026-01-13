import { FC, Fragment, useCallback, useRef, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { HiOutlineUpload } from 'react-icons/hi'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { useFormik } from 'formik'
import { SingleValue } from 'react-select'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'

import { useOrgStore } from '@renderer/store/organization.store'
import { SIDEBAR_WIDTH } from '@renderer/constants'
import {
  errorNotification,
  successNotification,
  warningNotification
} from '@renderer/components/common/Notification'
import Button from '@renderer/components/common/Button'
import CustomSelect from '@renderer/components/common/Select'
import { SelectOption } from '@models/UI.model'
import { StorageType, TaskType, FileType } from '@/lib/supabase'
import { projectsService, filesService, storageService } from '@/services/supabase'

type AddProjectFormik = {
  name: string
  files: File[]
  storage: SingleValue<SelectOption>
  taskType: SingleValue<SelectOption>
  azureStorageAccount: string
  azurePassKey: string
  azureContainerName: string
  awsSecretAccessKey: string
  awsAccessKeyId: string
  awsRegion: string
  awsApiVersion: string
  awsBucketName: string
}

const AddProject: FC = () => {
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({})
  const [uploading, setUploading] = useState(false)
  const orgId = useOrgStore((s) => s.selectedOrg)
  const projectIdRef = useRef<string | null>(null)

  const navigate = useNavigate()

  const formik = useFormik<AddProjectFormik>({
    initialValues: {
      name: '',
      files: [],
      storage: { value: 'default', label: 'Default' },
      taskType: { value: 'classification', label: 'Classification' },
      azurePassKey: '',
      azureStorageAccount: '',
      azureContainerName: '',
      awsAccessKeyId: '',
      awsApiVersion: '',
      awsBucketName: '',
      awsRegion: '',
      awsSecretAccessKey: ''
    },
    onSubmit: () => {}
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      formik.setFieldValue('files', [...formik.values.files, ...acceptedFiles])
    },
    [formik]
  )

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } })

  const createProject = useCallback(async () => {
    if (!orgId) return

    if (formik.values.name.trim().length === 0) {
      warningNotification('Project name field is required')
      return
    }

    if (formik.values.storage?.value === 'default' && formik.values.files.length === 0) {
      warningNotification('Please select at least one file to upload')
      return
    }

    const progressObj: { [fileName: string]: number } = {}
    for (const file of formik.values.files) {
      progressObj[file.name] = 0
    }
    setUploadProgress(progressObj)
    setUploading(true)

    try {
      // Step 1: Create project directly in Supabase (no server call)
      if (!projectIdRef.current) {
        if (!formik.values.storage?.value || !formik.values.taskType?.value) {
          setUploading(false)
          return
        }

        const project = await projectsService.createProject({
          name: formik.values.name,
          orgId: orgId,
          storage: formik.values.storage.value as StorageType,
          taskType: formik.values.taskType.value as TaskType,
          awsAccessKeyId: formik.values.awsAccessKeyId || undefined,
          awsApiVersion: formik.values.awsApiVersion || undefined,
          awsBucketName: formik.values.awsBucketName || undefined,
          awsRegion: formik.values.awsRegion || undefined,
          awsSecretAccessKey: formik.values.awsSecretAccessKey || undefined,
          azurePassKey: formik.values.azurePassKey || undefined,
          azureStorageAccount: formik.values.azureStorageAccount || undefined,
          azureContainerName: formik.values.azureContainerName || undefined
        })
        projectIdRef.current = project.id
      }

      const failedFiles: File[] = []

      // Step 2: Upload files directly to Supabase Storage and create file records
      for (const file of formik.values.files) {
        try {
          // Upload file directly to Supabase Storage
          const uploadResult = await storageService.uploadFileToStorage({
            orgId: orgId,
            projectId: projectIdRef.current!,
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
            projectId: projectIdRef.current!,
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
        formik.setFieldValue('files', failedFiles)
        errorNotification(`Failed to upload ${failedFiles.length} file(s)`)
      } else {
        successNotification('Successfully created project')
        navigate(`/orgs/${orgId}/projects`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setUploading(false)
      errorNotification('Failed to create project')
    }
  }, [orgId, formik.values, navigate])

  const deleteFile = (fileName: string) => {
    const dFiles = formik.values.files.filter((f) => f.name !== fileName)
    formik.setFieldValue('files', dFiles)
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
            disabled={uploading}
            name="name"
            placeholder=""
            className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
            type="text"
            onChange={formik.handleChange}
            value={formik.values.name}
          />

          <label className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4" htmlFor="email">
            Task Type<sup>*</sup>
          </label>
          <CustomSelect
            disabled={uploading}
            name="taskType"
            classname="mt-2"
            value={formik.values.taskType}
            options={[
              { value: 'classification', label: 'Classification' },
              { value: 'object-annotation', label: 'Object Annotation' }
            ]}
            onChange={(val) => formik.setFieldValue('taskType', val)}
          />

          <label className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4" htmlFor="email">
            Storage Type<sup>*</sup>
          </label>
          <CustomSelect
            disabled={uploading}
            name="storage"
            classname="mt-2"
            value={formik.values.storage}
            options={[
              { value: 'default', label: 'Default' },
              // { value: 'aws', label: 'AWS' },
              { value: 'azure', label: 'Azure' }
            ]}
            onChange={(val) => formik.setFieldValue('storage', val)}
          />

          {formik.values.storage?.value === 'aws' && (
            <>
              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AWS ACCESS KEY ID<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                name="awsAccessKeyId"
                placeholder=""
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.awsAccessKeyId}
              />

              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AWS SECRET ACCESS KEY<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                placeholder=""
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                name="awsSecretAccessKey"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.awsSecretAccessKey}
              />
              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AWS API VERSION<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                name="awsApiVersion"
                placeholder=""
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.awsApiVersion}
              />
              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AWS BUCKET NAME<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                name="awsBucketName"
                placeholder=""
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.awsBucketName}
              />
              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AWS REGION<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                name="awsRegion"
                placeholder=""
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.awsRegion}
              />
            </>
          )}

          {formik.values.storage?.value === 'azure' && (
            <>
              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AZURE STORAGE ACCOUNT<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                name="azureStorageAccount"
                placeholder=""
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.azureStorageAccount}
              />
              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AZURE PASS KEY<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                name="azurePassKey"
                placeholder=""
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.azurePassKey}
              />

              <label
                className="text-gray-400 text-base flex-grow-0 flex-shrink-0 mt-4"
                htmlFor="email"
              >
                AZURE CONTAINER NAME<sup>*</sup>
              </label>
              <input
                disabled={uploading}
                name="azureContainerName"
                placeholder="container name along with prefix, example: container-name/folder"
                className="w-full mt-2 p-2 text-lg border border-font-0.14 rounded-md flex-grow-0 flex-shrink-0"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.azureContainerName}
              />
            </>
          )}

          {formik.values.storage?.value === 'default' && (
            <>
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
                {formik.values.files.map((file) => (
                  <div
                    className="relative rounded-md border border-font-0.14 h-fit"
                    key={file.name}
                  >
                    {!uploading && (
                      <button
                        onClick={() => deleteFile(file.name)}
                        className="absolute text-white bg-red-500 z-30 -top-2 -right-2 rounded-full"
                      >
                        <IoClose size={20} />
                      </button>
                    )}

                    {file.type.startsWith('video') ? (
                      <video
                        className="rounded-t-md h-44 w-full object-cover"
                        src={URL.createObjectURL(file)}
                      />
                    ) : (
                      <img
                        className="rounded-t-md h-44 w-full object-cover"
                        src={URL.createObjectURL(file)}
                      />
                    )}

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
            </>
          )}
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
          onClick={createProject}
          type="button"
          className="py-2 px-4 bg-brand rounded-md text-white disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </Fragment>
  )
}

export default AddProject
