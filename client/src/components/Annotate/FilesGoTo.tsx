import { useFilesStore } from '@renderer/store/files.store'
import { KeyboardEvent, useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'

const FilesGoTo = () => {
  const { orgid: orgId, projectid: projectId } = useParams()
  const [goTo, setGoTo] = useState(1)
  const location = useLocation()
  const isReviewPage = location.pathname.startsWith('/review')
  const filesCount = useFilesStore((s) => s.count)
  const files = useFilesStore((s) => s.files)
  const setSelectedFile = useFilesStore((s) => s.setSelectedFile)
  const selectedFile = useFilesStore((s) => s.selectedFile)
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

  useEffect(() => {
    if (isReviewPage && selectedFile) {
      const fileIndex = files.findIndex((f) => f.id === selectedFile.id)
      if (fileIndex === -1) return

      setGoTo(skip + (fileIndex + 1))
    }
  }, [selectedFile, files])

  const handleGoTo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isReviewPage || e.key !== 'Enter' || !orgId || !projectId) return

    const gotoNum = Math.floor(Number(goTo))
    if (gotoNum <= 0 || gotoNum > filesCount) {
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
      skip: (gotoNum - 1).toString(),
      projectSkip: projectSkip.toString(),
      projectLimit: projectLimit.toString()
    })
    setSelectedFile(null)
  }

  return (
    <>
      {isReviewPage ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={goTo}
            className="w-20 border-2 border-brand rounded px-2"
            onChange={(e) => {
              setGoTo(Number(e.target.value))
            }}
            onKeyUp={handleGoTo}
          />
          <p> out of {filesCount}</p>
        </div>
      ) : null}
    </>
  )
}

export default FilesGoTo
