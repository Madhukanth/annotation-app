import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChangeEvent, FC, useCallback, useRef, useState } from 'react'
import { IoMdSend } from 'react-icons/io'
import { IoClose } from 'react-icons/io5'
import { useParams } from 'react-router-dom'
// import { FaRegImages } from 'react-icons/fa'
// import { useDropzone } from 'react-dropzone'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { cn } from '@renderer/utils/cn'

import {
  completeCommentFileUpload,
  createComment,
  createCommentFileUploadUrl,
  uploadCommentFile
} from '@renderer/helpers/axiosRequests'
import { errorNotification, warningNotification } from '../common/Notification'
import { useOrgStore } from '@renderer/store/organization.store'
import { useImageUntrackedStore } from '@renderer/pages/ImageAnnotate/store/image.store'
import { useFilesStore } from '@renderer/store/files.store'

const AddComment: FC = () => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()

  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const [content, setContent] = useState('')
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({})
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const selectedShape = useImageUntrackedStore((s) => s.selectedShape)

  const commentIdRef = useRef<string | null>(null)

  const queryClient = useQueryClient()
  const { mutateAsync: createCommentMutate } = useMutation(createComment)
  const { mutateAsync: createCommentFileUploadUrlMutate } = useMutation(createCommentFileUploadUrl)
  const { mutateAsync: uploadFileMutate } = useMutation(uploadCommentFile)
  const { mutateAsync: completeFileUploadMutate } = useMutation(completeCommentFileUpload)

  const onCreateComment = useCallback(async () => {
    if (!orgId || !projectId || !fileId) return

    if (content.trim().length === 0 && files.length === 0) {
      return
    }

    if (files.length > 4) {
      warningNotification('Only upto 4 images are allowed')
      return
    }

    const progressObj: { [fileName: string]: number } = {}
    for (const file of files) {
      progressObj[file.name] = 0
    }
    setUploadProgress(progressObj)
    setUploading(true)

    if (!commentIdRef.current) {
      const shapeId = selectedShape?.id
      const createCommentData = await createCommentMutate({
        orgId,
        projectId,
        fileId,
        content,
        shapeId: shapeId || undefined
      })
      commentIdRef.current = createCommentData.id
    }

    const failedFiles: File[] = []
    for (const file of files) {
      try {
        const createUrlData = await createCommentFileUploadUrlMutate({
          orgId,
          projectId,
          fileId,
          commentId: commentIdRef.current!,
          originalName: file.name,
          type: file.type
        })

        await uploadFileMutate({
          orgId,
          projectId,
          fileId,
          commentId: commentIdRef.current!,
          commentFileId: createUrlData.commentFileId,
          uploadFile: file,
          url: createUrlData.uploadUrl,
          storage: createUrlData.storage,
          onProgress: (percent) => {
            setUploadProgress((prgs) => ({ ...prgs, [file.name]: percent }))
          }
        })

        await completeFileUploadMutate({
          orgId,
          projectId,
          fileId,
          commentId: commentIdRef.current!,
          commentFileId: createUrlData.commentFileId,
          originalName: file.name,
          name: createUrlData.name,
          relativePath: createUrlData.relativePath
        })
      } catch (e) {
        failedFiles.push(file)
      }
    }

    setUploading(false)

    if (failedFiles.length > 0) {
      setFiles(failedFiles)
      errorNotification(`Failed to upload ${failedFiles.length} files`)
    } else {
      commentIdRef.current = null
      setFiles([])
      setContent('')
      queryClient.invalidateQueries(['comments'])
    }
  }, [orgId, projectId, fileId, files, content])

  const deleteFile = (fileName: string) => {
    setFiles((v) => v.filter((f) => f.name !== fileName))
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  // const onDrop = useCallback((acceptedFiles) => {
  //   setFiles(acceptedFiles)
  // }, [])

  // const { getRootProps, getInputProps } = useDropzone({
  //   onDrop,
  //   accept: { 'image/*': ['.png', '.jpeg', '.jpg'] }
  // })

  return (
    <div className="border-font-0.14 border rounded-lg w-full p-2">
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="type your comment..."
        className="w-full resize-none focus:outline-none"
        rows={3}
      />

      <div
        className={cn('grid grid-cols-2 gap-3', {
          'my-4': files.length > 0,
          'mb-1': files.length === 0
        })}
      >
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
              className="rounded-t-md h-20 w-full object-cover"
              src={URL.createObjectURL(file)}
            />
            <div className="w-full p-1 text-center text-sm overflow-hidden">
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

      <div className="flex gap-3 items-center justify-end">
        {/* <input {...getInputProps()} /> */}

        {/* <button className="disabled:opacity-50" {...getRootProps()}>
          <FaRegImages size={20} />
        </button> */}

        <button
          onClick={onCreateComment}
          className="disabled:opacity-50"
          disabled={uploading || (content.trim().length === 0 && files.length === 0)}
        >
          <IoMdSend size={20} />
        </button>
      </div>
    </div>
  )
}

export default AddComment
