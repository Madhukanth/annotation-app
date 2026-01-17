import { FC, ReactEventHandler, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { BsFillCheckCircleFill } from 'react-icons/bs'

import { CLASSIFY_ANNOTATION_LIST_WIDTH } from '@renderer/constants'
import { PrevImage, NextImage } from '@/features/image-annotation'
import { cn } from '@renderer/utils/cn'
import { useFilesStore } from '@renderer/store/files.store'
import { useMutation } from '@tanstack/react-query'
import { useOrgStore } from '@renderer/store/organization.store'
import AnnotationClass from '@models/AnnotationClass.model'
import SearchTags from '@renderer/components/common/SearchTags'
import Loader from '@renderer/components/common/Loader'
import { BiX } from 'react-icons/bi'
import Button from '@renderer/components/common/Button'
import { useClassifyStore } from '@renderer/store/classify.store'
import FileType from '@renderer/models/File.model'
import { filesService } from '@/services/supabase'

const ClassifyImage: FC = () => {
  const { projectid: projectId } = useParams()
  const selectedTags = useClassifyStore((s) => s.selectedTags)
  const setSelectedTag = useClassifyStore((s) => s.setSelectedTag)
  const [allTags, setAllTags] = useState<AnnotationClass[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const orgId = useOrgStore((state) => state.selectedOrg)
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const files = useFilesStore((state) => state.files)
  const updateFile = useFilesStore((state) => state.updateFile)
  const { mutate: updateFileTagsMutate } = useMutation({
    mutationFn: ({ fileId, tags }: { fileId: string; tags: string[] }) =>
      filesService.updateFileTags(fileId, tags)
  })
  const setSelectedFile = useFilesStore((s) => s.setSelectedFile)
  const currFileIdx = files.findIndex((f) => f.id === fileId)
  const [thumbFiles, setThumbFiles] = useState<FileType[]>([])

  const fileUpdateMutation = useMutation({
    mutationFn: ({ fileId, width, height }: { fileId: string; width: number; height: number }) =>
      filesService.updateFile(fileId, { width, height })
  })

  useEffect(() => {
    if (!fileObj) return
    setSelectedTag(fileObj.tags || [])
    setThumbFiles(files.slice(Math.max(currFileIdx, 10) - 10, currFileIdx + 100))

    const exist = thumbFiles.find((t) => t.id === fileObj.id)
    if (!exist) {
      setTimeout(() => {
        const thumbEle = document.getElementById(`thumb-${fileId}`)
        if (thumbEle) {
          thumbEle.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
      }, 50)
    }
  }, [fileObj])

  const onImageLoad: ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.target as HTMLImageElement

    if (!fileId || !img) return

    fileUpdateMutation.mutate({
      fileId,
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }

  const updateTagsToDB = (fTags: AnnotationClass[]) => {
    setSelectedTag(fTags)

    if (!fileId) return
    updateFile(fileId, { tags: fTags, complete: false, skipped: false })
    setSelectedFile({ ...fileObj, tags: fTags, complete: false, skipped: false })
    const tagIdList = fTags.map((v) => v.id)
    updateFileTagsMutate({ fileId, tags: tagIdList })
  }

  const onSelectTag = (tag: AnnotationClass) => {
    updateTagsToDB([tag])
  }

  const onDeselectTag = (tagId: string) => {
    updateTagsToDB(selectedTags.filter((t) => t.id !== tagId))
  }

  if (!fileObj) {
    return <Navigate to={`/orgs/${orgId}/projects/${projectId}/dashboard`} />
  }

  const selectedTagIdList = selectedTags.map((t) => t.id)

  return (
    <div
      className="grid gap-4 relative w-full p-4 h-[calc(100vh-60px)] bg-gray-200"
      style={{ gridTemplateRows: 'minmax(0, 1fr) 80px' }}
    >
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `minmax(0, 1fr) ${CLASSIFY_ANNOTATION_LIST_WIDTH}px`
        }}
      >
        <div className="relative bg-white rounded-xl flex justify-center items-center w-full h-full overflow-hidden">
          <img
            onLoad={onImageLoad}
            className="max-h-full max-w-full"
            src={fileObj.url}
            alt={fileObj.originalName}
          />
        </div>

        <div
          className="relative bg-white rounded-xl overflow-x-hidden overflow-y-scroll"
          style={{ width: `${CLASSIFY_ANNOTATION_LIST_WIDTH}px` }}
        >
          <div className="sticky top-0 p-3 bg-white">
            <SearchTags setIsFetching={setIsSearching} setTags={setAllTags} />
          </div>

          {isSearching && <Loader />}

          <div className="flex flex-col gap-4 flex-wrap p-3">
            {allTags.map((tag) => {
              const isSelected = selectedTagIdList.includes(tag.id)

              const handleClick = () => {
                if (isSelected) {
                  onDeselectTag(tag.id)
                } else {
                  onSelectTag(tag)
                }
              }

              return (
                <button
                  key={tag.id}
                  onClick={() => handleClick()}
                  style={{
                    borderColor: tag.color,
                    color: isSelected ? 'white' : tag.color,
                    backgroundColor: isSelected ? tag.color : 'white'
                  }}
                  className={cn('p-2 w-full rounded-lg break-all bg-white border')}
                >
                  <p>{tag.name}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div
        className="px-3 py-2 gap-x-3 grid gap-2 rounded-xl bg-white"
        style={{ gridTemplateColumns: '40px 1fr 40px' }}
      >
        <PrevImage />

        <div className="flex items-center overflow-scroll scroll-smooth h-full">
          {thumbFiles.map((file) => (
            <div id={`thumb-${file.id}`} key={`thumb-${file.id}`} className="h-full">
              <Button
                onClick={() => {
                  setSelectedFile(file)
                }}
                className={cn(
                  'h-full flex-shrink-0 bg-white relative w-20 rounded-lg border-4 border-transparent p-1',
                  { 'border-brand1': fileObj.id === file.id }
                )}
              >
                <img
                  className="w-20 object-cover max-h-12 h-full rounded-sm"
                  src={file.url}
                  alt={file.originalName}
                />

                {file.complete && (
                  <div className="absolute -top-0 -right-0 bg-white rounded-full text-green-500">
                    <BsFillCheckCircleFill />
                  </div>
                )}

                {file.skipped && (
                  <div className="absolute -top-0 -right-0 bg-red-500 text-white rounded-full">
                    <BiX />
                  </div>
                )}
              </Button>
            </div>
          ))}
        </div>

        <NextImage />
      </div>
    </div>
  )
}

export default ClassifyImage
