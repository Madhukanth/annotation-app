import { FC } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useLocation, useSearchParams } from 'react-router-dom'

import { useFilesStore } from '@renderer/store/files.store'
import { useImageUntrackedStore } from './store/image.store'

const PrevImage: FC = () => {
  const location = useLocation()
  const files = useFilesStore((state) => state.files)
  const selectPrevFile = useFilesStore((state) => state.selectPrevFile)
  const selectedFile = useFilesStore((state) => state.selectedFile)
  const setAIPoints = useImageUntrackedStore((s) => s.setAIPoints)
  const currentIndex = files.findIndex((f) => f.id === selectedFile?.id)
  const getPrevFile = useFilesStore((state) => state.getPrevFile)

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
  const isReviewPage = location.pathname.startsWith('/review')

  const handlePrev = async () => {
    setAIPoints(null)

    if (isReviewPage) {
      const prevFile = getPrevFile()
      if (!prevFile) {
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
      }

      selectPrevFile()
    } else {
      if (currentIndex <= 0) return
      selectPrevFile()
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

export default PrevImage
