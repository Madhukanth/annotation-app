import { FC, ReactEventHandler, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { BsFillCheckCircleFill } from 'react-icons/bs'
import { useMutation } from '@tanstack/react-query'

import { CLASSIFY_ANNOTATION_LIST_WIDTH } from '@renderer/constants'
import { getStoredUrl, groupIntoChunks } from '@renderer/utils/vars'
import { cn } from '@renderer/utils/cn'
import { useFilesStore } from '@renderer/store/files.store'
import { useOrgStore } from '@renderer/store/organization.store'
import AnnotationClass from '@models/AnnotationClass.model'
import SearchTags from '../common/SearchTags'
import Loader from '../common/Loader'
import Button from '@renderer/components/common/Button'
import { useClassifyStore } from '@renderer/store/classify.store'
import PrevGrid from './PrevGrid'
import NextGrid from './NextGrid'
import FileType from '@renderer/models/File.model'
import { filesService } from '@/services/supabase'

const ClassifyGrid: FC = () => {
  const { projectid: projectId } = useParams()
  const selectedTags = useClassifyStore((s) => s.selectedTags)
  const setSelectedTag = useClassifyStore((s) => s.setSelectedTag)
  const [allTags, setAllTags] = useState<AnnotationClass[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const orgId = useOrgStore((state) => state.selectedOrg)
  const files = useFilesStore((state) => state.files)
  const updateFile = useFilesStore((state) => state.updateFile)
  const { mutate: updateFileListTagMutate } = useMutation({
    mutationFn: ({ fileIds, tagIds }: { fileIds: string[]; tagIds: string[] }) =>
      filesService.updateMultipleFileTags(fileIds, tagIds)
  })
  const selectedImages = useClassifyStore((s) => s.selectedImages)
  const setSelectedImages = useClassifyStore((s) => s.setSelectedImages)
  const gridSize = useClassifyStore((s) => s.gridSize)
  const gridSkip = useClassifyStore((s) => s.gridSkip)
  const setGridSkip = useClassifyStore((s) => s.setGridSkip)
  const gridItems = files.slice(gridSkip, gridSkip + gridSize)
  const gridChunks = groupIntoChunks(files, gridSize)
  const gridIdx = gridSkip / gridSize
  const firstFile = gridChunks[gridIdx]?.[0]
  const gridChunksWithIdx = gridChunks.map((chunk, idx) => ({ chunk, idx }))

  const [thumbGrids, setThumbGrids] = useState<{ chunk: FileType[]; idx: number }[]>([])

  const fileUpdateMutation = useMutation({
    mutationFn: ({ fileId, width, height }: { fileId: string; width: number; height: number }) =>
      filesService.updateFile(fileId, { width, height })
  })

  useEffect(() => {
    if (!firstFile) return

    const exist = thumbGrids.find((t) => t.chunk[0]?.id === firstFile.id)
    setThumbGrids(gridChunksWithIdx.slice(Math.max(gridIdx, 10) - 10, gridIdx + 50))

    if (!exist) {
      setTimeout(() => {
        const thumbEle = document.getElementById(`thumb-${firstFile.id}`)
        if (thumbEle) {
          thumbEle.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
      }, 50)
    }
  }, [firstFile])

  const updateTagsToDB = (fTags: AnnotationClass[]) => {
    setSelectedTag(fTags)

    if (selectedImages.length === 0) return

    for (const imageId of selectedImages) {
      updateFile(imageId, { tags: fTags, complete: fTags.length > 0, skipped: fTags.length === 0 })
    }

    updateFileListTagMutate({
      fileIds: selectedImages,
      tagIds: fTags.map((f) => f.id)
    })
    setSelectedImages([])
    setSelectedTag([])
  }

  const onSelectTag = (tag: AnnotationClass) => {
    updateTagsToDB([tag])
  }

  const onDeselectTag = (tagId: string) => {
    updateTagsToDB(selectedTags.filter((t) => t.id !== tagId))
  }

  const handleSelectImage = (image: FileType) => {
    if (image.tags.length > 0 || image.skipped) {
      updateFile(image.id, { tags: [], complete: false, skipped: false })
      return
    }

    const isSelected = selectedImages.find((imgId) => imgId === image.id)
    if (isSelected) {
      setSelectedImages(selectedImages.filter((imgId) => imgId !== image.id))
    } else {
      setSelectedImages([...selectedImages, image.id])
    }
  }

  if (gridItems.length === 0) {
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
        <div
          className={cn(
            'grid justify-center-center gap-2 rounded-xl w-full h-full overflow-hidden',
            {
              'grid-cols-2 grid-rows-2': gridSize === 4,
              'grid-cols-3 grid-rows-2': gridSize === 6,
              'grid-cols-3 grid-rows-3': gridSize === 9,
              'grid-cols-4 grid-rows-4': gridSize === 16,
              'grid-cols-5 grid-rows-5': gridSize === 25
            }
          )}
        >
          {gridItems.map((file) => {
            const isSelected = selectedImages.includes(file.id)
            const tag = file.tags[0]
            const tagColor = tag?.color

            const onImageLoad: ReactEventHandler<HTMLImageElement> = (e) => {
              const img = e.target as HTMLImageElement

              if (!file.id || !img) return

              const { naturalWidth, naturalHeight } = img
              fileUpdateMutation.mutate({
                fileId: file.id,
                width: naturalWidth,
                height: naturalHeight
              })
            }

            return (
              <button
                key={file.id}
                onClick={() => handleSelectImage(file)}
                className={cn(
                  'overflow-hidden flex relative items-center justify-center bg-black rounded-lg cursor-pointer',
                  { 'border-4': !!tagColor && !isSelected }
                )}
                style={{ borderColor: tagColor }}
              >
                <img
                  onLoad={onImageLoad}
                  className="max-h-full max-w-full"
                  src={file.url}
                  alt={file.originalName}
                />

                {!isSelected && tag && (
                  <p className="absolute top-2 right-3" style={{ color: tag.color }}>
                    {tag.name}
                  </p>
                )}

                {!isSelected && file.skipped && (
                  <p className="absolute top-2 right-3" style={{ color: 'red' }}>
                    Skipped
                  </p>
                )}

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-white rounded-full text-green-500">
                    <BsFillCheckCircleFill />
                  </div>
                )}
              </button>
            )
          })}
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
            <button
              onClick={() => updateTagsToDB([])}
              className={cn(
                'p-2 w-full rounded-lg break-all bg-white border border-red-500 text-red-500'
              )}
            >
              <p>Skip</p>
            </button>

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
                    color: tag.color
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
        <PrevGrid />

        <div className="flex items-center overflow-scroll scroll-smooth h-full">
          {thumbGrids.map(({ chunk, idx }) => {
            const file = chunk[0]
            const allFilesCompletedOrSkipped = chunk.every((f) => f.complete || f.skipped)
            return (
              <div id={`thumb-${file.id}`} key={`thumb-${file.id}`} className="h-full">
                <Button
                  onClick={() => {
                    setSelectedImages([])
                    setGridSkip(idx * gridSize)
                  }}
                  className={cn(
                    'h-full flex-shrink-0 bg-white relative w-20 rounded-lg border-4 border-transparent p-1',
                    { 'border-brand1': firstFile?.id === file.id }
                  )}
                >
                  {file.type === 'image' ? (
                    <img
                      className="w-20 object-cover h-full max-h-12 rounded-sm"
                      src={file.url}
                      alt={file.originalName}
                    />
                  ) : (
                    <video
                      className="w-20 h-full object-cover rounded-sm"
                      src={getStoredUrl(file.url, file.storedIn)}
                    />
                  )}

                  {allFilesCompletedOrSkipped && (
                    <div className="absolute -top-0 -right-0 bg-white rounded-full text-green-500">
                      <BsFillCheckCircleFill />
                    </div>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        <NextGrid />
      </div>
    </div>
  )
}

export default ClassifyGrid
