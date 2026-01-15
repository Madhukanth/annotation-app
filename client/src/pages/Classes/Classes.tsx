import { FC, useEffect, useRef, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import CreateClassModal from '@renderer/components/Classes/CreateClassModal'
import { useAnnotationClasses } from '@/hooks/useAnnotationClasses'
import AnnotationClass from '@models/AnnotationClass.model'
import EditClassModal from '@renderer/components/Classes/EditClassModal'
import ClassCard from '@renderer/components/Classes/ClassCard'
import { useClassesStore } from '@renderer/store/classes.store'
import { useProjectStore } from '@renderer/store/project.store'
import CardSkeleton from '@/components/ui/CardSkeleton'

const Classes: FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editClass, setEditClass] = useState<AnnotationClass | null>(null)
  const { projectid: projectId } = useParams()

  const classes = useClassesStore((state) => state.classes)
  const setClasses = useClassesStore((state) => state.setClasses)
  const projects = useProjectStore((state) => state.projects)
  const currProject = projects.find((p) => p.id === projectId)

  const { data: annotationClassesData = [], isLoading: isInitialLoading } = useAnnotationClasses(projectId || '')
  
  // Track previous data to prevent infinite loop
  const prevDataRef = useRef<string>('')

  useEffect(() => {
    // Create a stable string representation to compare
    const dataKey = JSON.stringify(annotationClassesData.map(c => c.id))
    
    // Only update if data actually changed
    if (dataKey !== prevDataRef.current) {
      prevDataRef.current = dataKey
      
      // Transform snake_case to camelCase for compatibility
      const transformedClasses = annotationClassesData.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        notes: c.notes || '',
        attributes: c.attributes || [],
        text: c.has_text || false,
        ID: c.has_id || false,
        orgId: c.org_id,
        projectId: c.project_id,
        createdAt: c.created_at || '',
        modifiedAt: c.updated_at || c.created_at || ''
      }))
      
      setClasses(transformedClasses)
    }
  }, [annotationClassesData, setClasses])

  if (!currProject) {
    return null
  }

  const isClassificationProject = currProject.taskType === 'classification'
  return (
    <div className="h-full w-full flex flex-col">
      <div className="pb-4 flex justify-between items-center">
        <p className="text-xl">Classes</p>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex py-2 items-center rounded-3xl"
        >
          <FiPlus color="white" size={20} className="mr-2" />
          Create Class
        </Button>
      </div>

      {showCreateModal && (
        <CreateClassModal
          isTag={isClassificationProject}
          isOpen={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {!!editClass && (
        <EditClassModal
          isTag={isClassificationProject}
          isOpen
          annotationClass={editClass}
          onCancel={() => setEditClass(null)}
        />
      )}

      {isInitialLoading && classes.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max h-full overflow-scroll">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!isInitialLoading && classes.length === 0 && (
        <p className="text-lg text-center">No class found</p>
      )}

      {classes.length > 0 && (
        <div className="bg-white rounded-lg w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((annotationClass) => (
            <ClassCard
              key={annotationClass.id}
              annotationClass={annotationClass}
              onEdit={setEditClass}
              isDefaultClass={annotationClass.id === currProject.defaultClassId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Classes
