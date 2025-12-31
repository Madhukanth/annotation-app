import { FC } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useFilesStore } from '@renderer/store/files.store'

const NextVideo: FC = () => {
  const selectNextFile = useFilesStore((s) => s.selectNextFile)

  const handleNext = async () => {
    selectNextFile()
  }

  useHotkeys(['right', 'f'], handleNext)

  return (
    <div className="flex items-center justify-center w-10">
      <button
        onClick={handleNext}
        className="h-full w-full hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {'>'}
      </button>
    </div>
  )
}

export default NextVideo
