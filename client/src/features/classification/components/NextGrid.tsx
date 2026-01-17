import { FC } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useFilesStore } from '@renderer/store/files.store'
import { warningNotification } from '@renderer/components/common/Notification'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useClassifyStore } from '@renderer/store/classify.store'
import { groupIntoChunks } from '@renderer/utils/vars'
import { useUpdateMultipleFileTags } from '@/hooks/useFiles'

const NextGrid: FC = () => {
  const files = useFilesStore((state) => state.files)
  const count = useFilesStore((state) => state.count)

  const { projectid: projectId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const complete = searchParams.get('complete')
  const skip = Number(searchParams.get('skip') || 0)
  const limit = Number(searchParams.get('limit') || 1000)
  const annotator = searchParams.get('annotator')
  const skipped = searchParams.get('skipped')
  const completedAfter = searchParams.get('completedAfter')
  const skippedAfter = searchParams.get('skippedAfter')
  const tags = searchParams.get('tags')
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const location = useLocation()
  const isReviewPage = location.pathname.startsWith('/review')
  const setSelectedFile = useFilesStore((state) => state.setSelectedFile)
  const gridSize = useClassifyStore((s) => s.gridSize)
  const gridSkip = useClassifyStore((s) => s.gridSkip)
  const setGridSkip = useClassifyStore((s) => s.setGridSkip)
  const setSelectedImages = useClassifyStore((s) => s.setSelectedImages)
  const gridItems = files.slice(gridSkip, gridSkip + gridSize)
  const gridChunks = groupIntoChunks(files, gridSize)
  const gridIdx = gridSkip / gridSize
  const nextChunk = gridChunks[gridIdx + 1]

  const { mutate: updateFileListTagMutate } = useUpdateMultipleFileTags()

  const handleNext = async () => {
    const inCompleteImages = gridItems.filter((f) => !f.complete && !f.skipped)
    if (inCompleteImages.length > 0) {
      warningNotification('Please tag all images in grid')
      return
    }

    const noTagImages = gridItems.filter((f) => !f.tags || f.tags.length === 0)
    if (projectId && noTagImages.length > 0) {
      updateFileListTagMutate({
        fileIds: noTagImages.map((i) => i.id),
        tagIds: []
      })
    }

    // For annotating page
    if (!isReviewPage && !nextChunk) {
      const isIncomplete = useFilesStore.getState().files.find((f) => !f.complete && !f.skipped)
      if (isIncomplete) {
        warningNotification(
          'Please complete all grids in the current set before moving to the next one'
        )
        return
      }
    }

    // For reviewing page
    if (isReviewPage && !nextChunk) {
      if (skip + limit >= count) {
        return
      }

      setSearchParams({
        ...(complete && { complete }),
        ...(annotator && { annotator }),
        ...(skipped && { skipped }),
        ...(completedAfter && { completedAfter }),
        ...(skippedAfter && { skippedAfter }),
        ...(tags && { tags }),
        limit: limit.toString(),
        skip: (skip + limit).toString(),
        projectSkip: projectSkip.toString(),
        projectLimit: projectLimit.toString()
      })

      setSelectedImages([])
      setGridSkip(0)
      setSelectedFile(null)
      return
    }

    if (!nextChunk) {
      setSelectedImages([])
      setGridSkip(0)
      setSelectedFile(null)
      return
    }

    setSelectedImages([])
    setGridSkip(gridSkip + gridSize)
  }

  useHotkeys(['right'], handleNext)

  useHotkeys(['f'], () => {
    if (isReviewPage) {
      handleNext()
    }
  })

  return (
    <div className="flex items-center justify-center w-10">
      <button
        id="next-img-btn"
        onClick={handleNext}
        className="h-full w-full hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {'>'}
      </button>
    </div>
  )
}

export default NextGrid
