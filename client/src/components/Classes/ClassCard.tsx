import AnnotationClass from '@models/AnnotationClass.model'
import { FC, useState } from 'react'
import { BsFileTextFill } from 'react-icons/bs'
import { FaAddressCard } from 'react-icons/fa'
import OutlineButton from '../common/OutlineButton'
import { useDeleteAnnotationClass } from '@/hooks/useAnnotationClasses'
import { useUpdateProject } from '@/hooks/useProjects'
import { errorNotification, successNotification } from '../common/Notification'
import { useClassesStore } from '@renderer/store/classes.store'
import { useParams } from 'react-router-dom'
import CustomModal from '../common/CustomModal'
import ConfirmDelete from '../common/ConfirmDelete'
import { cn } from '@renderer/utils/cn'
import { useProjectStore } from '@renderer/store/project.store'

type ClassCardProps = {
  annotationClass: AnnotationClass
  isDefaultClass: boolean
  onEdit: (annotationClass: AnnotationClass) => void
}
const ClassCard: FC<ClassCardProps> = ({ annotationClass, isDefaultClass, onEdit }) => {
  const { mutate: deleteAnnotationClassMutate, isLoading } = useDeleteAnnotationClass()
  const deleteClass = useClassesStore((s) => s.deleteClass)
  const updateProjectStore = useProjectStore((s) => s.updateProject)
  const { projectid: projectId } = useParams()
  const [showDelete, setShowDelete] = useState(false)

  const { mutate: updateProjectMutation } = useUpdateProject()

  const handleDelete = (classId: string) => {
    if (!projectId) return

    deleteAnnotationClassMutate(
      { classId, projectId },
      {
        onSuccess() {
          deleteClass(classId)
          successNotification('Delete class successfully')
        },
        onError() {
          errorNotification('Failed to delete the class')
        }
      }
    )
  }

  const handleMarkAsDefault = (classId: string) => {
    if (!projectId || isDefaultClass) return

    updateProjectMutation(
      { projectId, input: { defaultClassId: classId } },
      {
        onSuccess() {
          updateProjectStore(projectId, { defaultClassId: classId })
          successNotification(`Marked ${annotationClass.name} as default class`)
        },
        onError() {
          errorNotification(`Failed to mark ${annotationClass.name} as default class`)
        }
      }
    )
  }

  return (
    <>
      {!!showDelete && (
        <CustomModal isOpen closeModal={() => setShowDelete(false)}>
          <ConfirmDelete
            loading={isLoading}
            name={`class "${annotationClass.name}"`}
            onDelete={() => handleDelete(annotationClass.id)}
            onCancel={() => setShowDelete(false)}
          />
        </CustomModal>
      )}

      <div key={annotationClass.id} className="w-full h-fit  rounded-lg overflow-hidden">
        <div className="w-full h-44" style={{ background: annotationClass.color }}></div>

        <div className="p-3 border-2 rounded-t-none border-t-0 border-font-0.14 rounded-lg">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex-grow">
              <p className="text-xl">{annotationClass.name}</p>
              <p className="text-sm opacity-50">
                {new Date(annotationClass.createdAt).toDateString()}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              {annotationClass.text && (
                <div className="flex items-center gap-1 bg-brand/30 w-fit rounded-md py-1 px-2">
                  <BsFileTextFill />
                  Text
                </div>
              )}

              {annotationClass.ID && (
                <div className="flex items-center gap-1 bg-brand/30 w-fit rounded-md py-1 px-2">
                  <FaAddressCard />
                  ID
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2 items-center rounded-lg">
            <OutlineButton onClick={() => onEdit(annotationClass)}>Edit</OutlineButton>
            <OutlineButton
              className={cn({ 'bg-brand text-white': isDefaultClass })}
              onClick={() => handleMarkAsDefault(annotationClass.id)}
            >
              Mark Default
            </OutlineButton>
            <div className="flex-grow"></div>

            <OutlineButton
              disabled={isLoading}
              onClick={() => setShowDelete(true)}
              className="text-red-500"
            >
              Delete
            </OutlineButton>
          </div>
        </div>
      </div>
    </>
  )
}

export default ClassCard
