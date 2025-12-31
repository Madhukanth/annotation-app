import { useMutation } from '@tanstack/react-query'

import Button from '../common/Button'
import { updateFileSkippedStatus } from '@renderer/helpers/axiosRequests'
import { useFilesStore } from '@renderer/store/files.store'
import { useParams } from 'react-router-dom'
import { useImageStore } from '@renderer/pages/ImageAnnotate/store/image.store'
import { useProjectStore } from '@renderer/store/project.store'

const SkipButton = () => {
  const { orgid: orgId, projectid: projectId } = useParams()

  const updateFile = useFilesStore((s) => s.updateFile)
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  const getProjectById = useProjectStore((s) => s.getProjectById)
  const currProject = getProjectById(projectId || '')
  const isClassificationProject = currProject?.taskType === 'classification'

  const polygons = useImageStore((state) => state.polygons)
  const circles = useImageStore((state) => state.circles)
  const rectangles = useImageStore((state) => state.rectangles)
  const faces = useImageStore((state) => state.faces)
  const lines = useImageStore((state) => state.lines)

  const anyShapesExist =
    polygons.length || circles.length || rectangles.length || faces.length || lines.length

  const skipMutation = useMutation({ mutationFn: updateFileSkippedStatus })

  const handleSkip = () => {
    if (!orgId || !projectId || !fileId) return

    if (anyShapesExist && !isClassificationProject) return

    updateFile(fileId, { skipped: true, complete: false })
    skipMutation.mutate({
      orgId: orgId,
      projectId: projectId,
      fileId: fileId,
      skipped: true
    })
    const nextImgBtn = document.getElementById('next-img-btn')
    if (nextImgBtn) {
      setTimeout(() => {
        nextImgBtn.click()
      }, 50)
    }
  }

  return (
    <Button
      disabled={!!anyShapesExist && !isClassificationProject}
      className="py-2"
      onClick={handleSkip}
    >
      Skip
    </Button>
  )
}

export default SkipButton
