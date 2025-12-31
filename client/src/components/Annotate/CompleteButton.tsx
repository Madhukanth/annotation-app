import { useMutation } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'

import Button from '../common/Button'
import { updateFileCompleteStatus } from '@renderer/helpers/axiosRequests'
import { useFilesStore } from '@renderer/store/files.store'
import { useImageStore } from '@renderer/pages/ImageAnnotate/store/image.store'
import { useClassifyStore } from '@renderer/store/classify.store'

const CompleteButton = () => {
  const { orgid: orgId, projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const updateFile = useFilesStore((s) => s.updateFile)

  const fileId = fileObj?.id

  const isGrid = useClassifyStore((s) => s.isGrid)
  const selectedTags = useClassifyStore((s) => s.selectedTags)

  const polygons = useImageStore((state) => state.polygons)
  const circles = useImageStore((state) => state.circles)
  const rectangles = useImageStore((state) => state.rectangles)
  const faces = useImageStore((state) => state.faces)
  const lines = useImageStore((state) => state.lines)

  const completeMutation = useMutation({ mutationFn: updateFileCompleteStatus })

  const anyShapesExist =
    polygons.length || circles.length || rectangles.length || faces.length || lines.length

  const handleComplete = () => {
    if (!orgId || !projectId || !fileId) return

    if (!isGrid && !anyShapesExist && selectedTags.length === 0) return

    if (!isGrid) {
      updateFile(fileId, { complete: true, skipped: false })
      completeMutation.mutate({
        orgId: orgId,
        projectId: projectId,
        fileId: fileId,
        complete: true
      })
    }
    const nextImgBtn = document.getElementById('next-img-btn')
    if (nextImgBtn) {
      setTimeout(() => {
        nextImgBtn.click()
      }, 50)
    }
  }

  useHotkeys(['c'], handleComplete)

  return (
    <Button
      disabled={!isGrid && selectedTags.length === 0 && !anyShapesExist}
      className="py-2"
      onClick={handleComplete}
    >
      Complete
    </Button>
  )
}

export default CompleteButton
