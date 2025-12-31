import { FC, RefObject, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Stage as StageType } from 'konva/lib/Stage'

import { useOrgStore } from '@renderer/store/organization.store'
import { fetchAnnotationClasses } from '@renderer/helpers/axiosRequests'
import { useImageUntrackedStore } from '@renderer/pages/ImageAnnotate/store/image.store'
import { cn } from '@renderer/utils/cn'
import { SIDEBAR_WIDTH } from '@renderer/constants'
import AnnotateToolbar from '@renderer/pages/ImageAnnotate/AnnotationToolbar'
import { useProjectStore } from '@renderer/store/project.store'

type AnnotateSidebarProps = {
  imgRef: RefObject<HTMLImageElement>
  stageRef: RefObject<StageType>
  finalizePolygon: () => void
  finalizeLine: () => void
  drawPolygon: () => void
}
const AnnotateSidebar: FC<AnnotateSidebarProps> = ({
  imgRef,
  stageRef,
  finalizeLine,
  finalizePolygon,
  drawPolygon
}) => {
  const orgId = useOrgStore((state) => state.selectedOrg)
  const { projectid: projectId } = useParams()

  const getProjectById = useProjectStore((s) => s.getProjectById)
  const project = getProjectById(projectId || '')
  const { data: annotationClasses } = useQuery(
    ['classes', { orgId: orgId!, projectId: projectId! }],
    fetchAnnotationClasses,
    { enabled: !!orgId, initialData: [] }
  )

  const selectedClass = useImageUntrackedStore((s) => s.selectedClass)
  const setSelectedClass = useImageUntrackedStore((s) => s.setSelectedClass)

  useEffect(() => {
    if (!project || !project.defaultClassId || annotationClasses.length === 0) {
      setSelectedClass(null)
    } else {
      setSelectedClass(annotationClasses.find((ac) => ac.id === project.defaultClassId) || null)
    }
  }, [project, annotationClasses])

  return (
    <div style={{ width: `${SIDEBAR_WIDTH}px` }} className="h-full bg-brand1 text-white py-6 px-2">
      <div className="h-1/2 overflow-scroll">
        <p className="text-lg">Classes</p>

        {annotationClasses.map((annotationClass) => (
          <button
            onClick={() => setSelectedClass(annotationClass)}
            key={annotationClass.id}
            className={cn(
              'w-full py-2 px-2 rounded-md mt-2 flex items-center gap-2 cursor-pointer hover:bg-brand/50',
              { 'bg-brand': selectedClass?.id === annotationClass.id }
            )}
          >
            <div
              className="h-5 w-5 rounded-sm"
              style={{ backgroundColor: annotationClass.color }}
            ></div>
            <p>{annotationClass.name}</p>
          </button>
        ))}
      </div>

      <div className="border-t border-white pt-2 flex gap-3 flex-row">
        <AnnotateToolbar
          imgRef={imgRef}
          stageRef={stageRef}
          finalizeLine={finalizeLine}
          finalizePolygon={finalizePolygon}
          drawPolygon={drawPolygon}
        />
      </div>
    </div>
  )
}

export default AnnotateSidebar
