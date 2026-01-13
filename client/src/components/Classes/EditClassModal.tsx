import { ChangeEvent, FC, KeyboardEventHandler, useEffect, useState } from 'react'
import { IoMdCloseCircle } from 'react-icons/io'
import { ChromePicker } from 'react-color'
import { useParams } from 'react-router-dom'

import CustomModal from '../common/CustomModal'
import Button from '../common/Button'
import { errorNotification, warningNotification } from '../common/Notification'
import { cn } from '@renderer/utils/cn'
import { useUpdateAnnotationClass } from '@/hooks/useAnnotationClasses'
import AnnotationClass from '@models/AnnotationClass.model'
import { useClassesStore } from '@renderer/store/classes.store'

type EditClassModalProps = {
  isOpen: boolean
  onCancel: () => void
  annotationClass: AnnotationClass
  isTag?: boolean
}
const EditClassModal: FC<EditClassModalProps> = ({ isOpen, onCancel, annotationClass, isTag }) => {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [isTextEnabled, setTextEnabled] = useState(false)
  const [isIDEnabled, setIDEnabled] = useState(false)
  const [attrList, setAttrList] = useState<string[]>([])
  const [attrName, setAttrName] = useState('')
  const [colorVal, setColorVal] = useState('#1c827f')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const updateClass = useClassesStore((s) => s.updateClass)
  const { projectid: projectId } = useParams()

  const { mutate: updateAnnotationClassMutate, isLoading } = useUpdateAnnotationClass()

  useEffect(() => {
    setName(annotationClass.name)
    setNotes(annotationClass.notes)
    setTextEnabled(annotationClass.text)
    setIDEnabled(annotationClass.ID)
    setAttrList(annotationClass.attributes)
    setColorVal(annotationClass.color)
  }, [annotationClass])

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }

  const handleAttrNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAttrName(e.target.value)
  }

  const handleAddAttrName = () => {
    if (attrName.trim().length === 0) return

    if (attrList.includes(attrName)) {
      warningNotification('Attribues must be unique')
      return
    }
    setAttrList((v) => [...v, attrName])
    setAttrName('')
  }

  const handleRemoveAttrName = (val: string) => {
    setAttrList((list) => list.filter((v) => v !== val))
  }

  const handleKeyUp: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      handleAddAttrName()
    }
  }

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker)
  }

  const handleUpdate = () => {
    if (!projectId) return
    updateAnnotationClassMutate(
      {
        classId: annotationClass.id,
        input: {
          name,
          notes,
          color: colorVal,
          attributes: attrList,
          hasText: isTextEnabled,
          hasId: isIDEnabled
        }
      },
      {
        onSuccess: (uClass) => {
          // Transform snake_case to camelCase for store
          updateClass(uClass.id, {
            id: uClass.id,
            name: uClass.name,
            color: uClass.color,
            notes: uClass.notes || '',
            attributes: uClass.attributes || [],
            text: uClass.has_text || false,
            ID: uClass.has_id || false
          })
          onCancel()
        },
        onError(e) {
          let errorMessage = 'Failed to update the class'
          if (e instanceof Error && e.message?.includes('duplicate')) {
            errorMessage = `Class with name "${name}" already exist`
          }

          errorNotification(errorMessage)
        }
      }
    )
  }

  return (
    <CustomModal isOpen={isOpen}>
      <div
        className="flex flex-col gap-5 p-5 bg-white rounded-md overflow-y-scroll w-screen"
        style={{ maxHeight: 'calc(100vh - 40px)', maxWidth: '500px' }}
      >
        <p className="text-2xl">Edit Class</p>
        <div>
          <label>Name</label>
          <input
            className="w-full p-2 border-brand1 border rounded-md mt-1"
            placeholder="type name..."
            value={name}
            onChange={handleNameChange}
          />
        </div>

        {!isTag && (
          <>
            <div className="flex items-center gap-2">
              <button
                style={{ padding: '2px', height: '22px' }}
                className={cn('w-12  border bg-white border-brand rounded-xl', {
                  'bg-brand': isTextEnabled
                })}
                onClick={() => setTextEnabled(!isTextEnabled)}
              >
                <div
                  className={cn('h-4 w-4 bg-brand rounded-full ', {
                    'bg-white ml-auto': isTextEnabled
                  })}
                ></div>
              </button>
              <label>Text</label>
            </div>

            <div className="flex items-center gap-2">
              <button
                style={{ padding: '2px', height: '22px' }}
                className={cn('w-12  border bg-white border-brand rounded-xl', {
                  'bg-brand': isIDEnabled
                })}
                onClick={() => setIDEnabled(!isIDEnabled)}
              >
                <div
                  className={cn('h-4 w-4 bg-brand rounded-full ', {
                    'bg-white ml-auto': isIDEnabled
                  })}
                ></div>
              </button>
              <label>ID</label>
            </div>

            <div>
              <label>Attributes</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  className="p-2 flex-grow border-brand1 border rounded-md"
                  placeholder="type attributes..."
                  value={attrName}
                  onChange={handleAttrNameChange}
                  onKeyUp={handleKeyUp}
                />
                <Button onClick={handleAddAttrName} className="py-2">
                  Add
                </Button>
              </div>

              {attrList.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {attrList.map((name) => (
                    <div key={name} className="relative  p-2 rounded-lg bg-brand/60 w-fit">
                      <p className="break-all">{`# ${name}`}</p>
                      <button
                        onClick={() => handleRemoveAttrName(name)}
                        className="bg-white text-red-500 cursor-pointer absolute rounded-lg -top-2  -right-2"
                      >
                        <IoMdCloseCircle size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <label>Color</label>
          <div className="relative">
            <button
              className="w-full h-10 rounded-lg mt-1"
              style={{ background: colorVal }}
              onClick={toggleColorPicker}
            ></button>
            {showColorPicker && (
              <ChromePicker
                className="absolute left-1/2 -translate-x-1/2"
                disableAlpha
                color={colorVal}
                onChange={({ rgb: { r, g, b } }) => setColorVal(`rgb(${r}, ${g}, ${b})`)}
              />
            )}
          </div>
        </div>

        <div>
          <label>Notes</label>
          <textarea
            className="resize-none w-full p-2 border-brand1 border rounded-md mt-1"
            rows={4}
            placeholder="type notes..."
            value={notes}
            onChange={handleNotesChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="p-2 rounded-md border-brand border text-brand" onClick={onCancel}>
            Cancel
          </button>
          <button
            disabled={isLoading}
            onClick={handleUpdate}
            className="bg-brand p-2 rounded-md text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </CustomModal>
  )
}

export default EditClassModal
