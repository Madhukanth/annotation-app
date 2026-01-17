import { FC } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useFilesStore } from '@renderer/store/files.store'
import { useImageUntrackedStore } from '../store/image.store'
import { warningNotification } from '@renderer/components/common/Notification'
import { useLocation, useSearchParams } from 'react-router-dom'

const NextImage: FC = () => {
  const files = useFilesStore((state) => state.files)
  const count = useFilesStore((state) => state.count)

  const getNextFile = useFilesStore((state) => state.getNextFile)

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
  const selectNextFile = useFilesStore((state) => state.selectNextFile)
  const setAIPoints = useImageUntrackedStore((s) => s.setAIPoints)

  const handleNext = async () => {
    setAIPoints(null)

    const nextFile = getNextFile()

    // For annotating page
    if (!isReviewPage && !nextFile) {
      const isIncomplete = files.find((f) => !f.complete && !f.skipped)
      if (isIncomplete) {
        warningNotification(
          'Please complete or skip all files in the current set before moving to the next one'
        )
        return
      }
    }

    // For reviewing page
    if (isReviewPage && !nextFile) {
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
    }

    selectNextFile()
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

export default NextImage
