import { FC } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useLocation, useSearchParams } from 'react-router-dom'

import { useFilesStore } from '@renderer/store/files.store'
import { useClassifyStore } from '@renderer/store/classify.store'
import { groupIntoChunks } from '@renderer/utils/vars'

const PrevGrid: FC = () => {
  const location = useLocation()

  const gridSize = useClassifyStore((s) => s.gridSize)
  const gridSkip = useClassifyStore((s) => s.gridSkip)
  const setGridSkip = useClassifyStore((s) => s.setGridSkip)
  const setSelectedImages = useClassifyStore((s) => s.setSelectedImages)
  const files = useFilesStore((state) => state.files)
  const setSelectedFile = useFilesStore((state) => state.setSelectedFile)
  const gridChunks = groupIntoChunks(files, gridSize)
  const gridIdx = gridSkip / gridSize
  const prevChunk = gridChunks[gridIdx - 1]

  const [searchParams, setSearchParams] = useSearchParams()
  const complete = searchParams.get('complete')
  const skip = Number(searchParams.get('skip') || 0)
  const limit = Number(searchParams.get('limit') || 1000)
  const annotator = searchParams.get('annotator')
  const skipped = searchParams.get('skipped')
  const tags = searchParams.get('tags')
  const completedAfter = searchParams.get('completedAfter')
  const skippedAfter = searchParams.get('skippedAfter')
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const isReviewPage = location.pathname.startsWith('/review')

  const handlePrev = async () => {
    if (isReviewPage) {
      if (!prevChunk) {
        if (skip <= 0) return

        setSearchParams({
          ...(complete && { complete }),
          ...(annotator && { annotator }),
          ...(skipped && { skipped }),
          ...(completedAfter && { completedAfter }),
          ...(skippedAfter && { skippedAfter }),
          ...(tags && { tags }),
          limit: limit.toString(),
          skip: Math.max(skip - limit, 0).toString(),
          prevSkipTo: skip.toString(),
          projectSkip: projectSkip.toString(),
          projectLimit: projectLimit.toString()
        })

        setSelectedImages([])
        setGridSkip(0)
        setSelectedFile(null)
        return
      }

      setSelectedImages([])
      setGridSkip(gridSkip - gridSize)
    } else {
      if (gridSkip - gridSize < 0) return
      setSelectedImages([])
      setGridSkip(gridSkip - gridSize)
    }
  }

  useHotkeys(['left'], handlePrev)

  return (
    <div className="flex items-center justify-center w-10">
      <button
        onClick={handlePrev}
        className="h-full w-full hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {'<'}
      </button>
    </div>
  )
}

export default PrevGrid
