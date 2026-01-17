import Button from '@renderer/components/common/Button'
import { useUpdateFile } from '@/hooks/useFiles'
import { useFilesStore } from '@renderer/store/files.store'
import { useParams } from 'react-router-dom'
import { useImageStore } from '@/features/image-annotation'
import { useProjectStore } from '@renderer/store/project.store'

const SkipButton = () => {
  const { projectid: projectId } = useParams()

  const updateFileStore = useFilesStore((s) => s.updateFile)
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

  const { mutate: skipMutation } = useUpdateFile()

  const handleSkip = () => {
    if (!projectId || !fileId) return

    if (anyShapesExist && !isClassificationProject) return

    updateFileStore(fileId, { skipped: true, complete: false })
    skipMutation({
      fileId: fileId,
      input: { skipped: true }
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
