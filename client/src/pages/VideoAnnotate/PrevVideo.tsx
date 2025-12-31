import { FC } from 'react'

import { useFilesStore } from '@renderer/store/files.store'
import { useHotkeys } from 'react-hotkeys-hook'

const PrevVideo: FC = () => {
  const selectedFile = useFilesStore((s) => s.selectedFile)
  const selectPrevFile = useFilesStore((s) => s.selectPrevFile)

  const files = useFilesStore((s) => s.files)

  const currentIndex = files.findIndex((f) => f.id === selectedFile?.id)

  const handlePrev = async () => {
    selectPrevFile()
  }

  useHotkeys(['left'], handlePrev)

  return (
    <div className="flex items-center justify-center w-10">
      <button
        disabled={currentIndex <= 0}
        onClick={handlePrev}
        className="h-full w-full hover:bg-gray-200 rounded-lg disabled:opacity-5"
      >
        {'<'}
      </button>
    </div>
  )
}

export default PrevVideo
