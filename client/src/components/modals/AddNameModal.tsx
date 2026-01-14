import { ChangeEvent, FC, useEffect, useState } from 'react'

import CustomModal from '@/components/ui/CustomModal'
import { useClassesStore } from '@renderer/store/classes.store'
import CustomSelect from '@/components/ui/Select'
import { useParams } from 'react-router-dom'
import AnnotationClass from '@renderer/models/AnnotationClass.model'
import { useAnnotationClasses } from '@/hooks/useAnnotationClasses'

type AddNameModalProps = {
  initName: string
  isOpen: boolean
  selectedClass: AnnotationClass | null
  onCancel: () => void
  onAdd: (
    name: string,
    notes: string,
    classId?: string,
    attribute?: string,
    text?: string,
    ID?: string,
    color?: string
  ) => void
}
const AddNameModal: FC<AddNameModalProps> = ({
  onCancel,
  onAdd,
  isOpen,
  initName,
  selectedClass: defaultSelectedClass
}) => {
  const { projectid: projectId } = useParams()
  const setClasses = useClassesStore((s) => s.setClasses)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedClassOpt, setSelectedClassOpt] = useState<{ label: string; value: string } | null>(
    null
  )
  const [selectedAttr, setSelectedAttr] = useState<{ label: string; value: string } | null>(null)
  const [text, setText] = useState('')
  const [ID, setID] = useState('')

  const { data: annotationClassesData = [] } = useAnnotationClasses(projectId || '')
  // Transform to legacy format
  const classes: AnnotationClass[] = annotationClassesData.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    attributes: c.attributes || [],
    text: c.has_text || false,
    ID: c.has_id || false,
    orgId: c.org_id,
    projectId: c.project_id,
    notes: c.notes || '',
    createdAt: c.created_at || '',
    modifiedAt: c.updated_at || ''
  }))
  const classSelectOptions = classes.map((c) => ({ label: c.name, value: c.id }))
  const selectedClass = selectedClassOpt
    ? classes.find((c) => c.id === selectedClassOpt.value)
    : null
  const attributeOptions = selectedClass
    ? selectedClass.attributes.map((a) => ({ label: a, value: a }))
    : []

  useEffect(() => {
    if (defaultSelectedClass) {
      setSelectedClassOpt({ label: defaultSelectedClass.name, value: defaultSelectedClass.id })
    } else {
      setSelectedClassOpt(null)
    }

    return () => {
      setSelectedClassOpt(null)
    }
  }, [defaultSelectedClass])

  useEffect(() => {
    setName(initName)
  }, [initName])

  useEffect(() => {
    setClasses(classes)
  }, [classes])

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }

  const handleIDChange = (e: ChangeEvent<HTMLInputElement>) => {
    setID(e.target.value)
  }

  const handleAddClick = () => {
    onAdd(name, notes, selectedClassOpt?.value, selectedAttr?.value, text, ID, selectedClass?.color)
    setName('')
    setNotes('')
    setSelectedAttr(null)
    setText('')
    setID('')
  }

  const handleClassSelect = (val: unknown) => {
    setSelectedClassOpt(val as { value: string; label: string })
    setSelectedAttr(null)
    setText('')
    setID('')
  }

  return (
    <CustomModal isOpen={isOpen}>
      <div className="flex flex-col gap-5 p-5 bg-white rounded-md w-screen max-w-[600px]">
        <p className="text-center text-lg">Add Polygon</p>

        <div>
          <label>Name</label>
          <input
            className="w-full p-2 border-gray-500 border rounded-md mt-1"
            placeholder="type name here..."
            value={name}
            onChange={handleNameChange}
          />
        </div>

        <div>
          <label>Notes</label>
          <textarea
            className="resize-none w-full p-2 border-gray-500 border rounded-md mt-1"
            rows={4}
            placeholder="type notes here..."
            value={notes}
            onChange={handleNotesChange}
          />
        </div>

        <div>
          <label>Select Class</label>
          <CustomSelect
            classname="mt-1 normal-case"
            options={classSelectOptions}
            value={selectedClassOpt}
            onChange={handleClassSelect}
          />
        </div>

        {attributeOptions.length > 0 && (
          <div>
            <label>Select Attribute</label>
            <CustomSelect
              classname="mt-1 normal-case"
              options={attributeOptions}
              value={selectedAttr}
              onChange={setSelectedAttr}
            />
          </div>
        )}

        {selectedClass?.text && (
          <div>
            <label>Text</label>
            <textarea
              className="resize-none w-full p-2 border-gray-500 border rounded-md mt-1"
              rows={4}
              placeholder="type text here..."
              value={text}
              onChange={handleTextChange}
            />
          </div>
        )}

        {selectedClass?.ID && (
          <div>
            <label>ID</label>
            <input
              className="w-full p-2 border-gray-500 border rounded-md mt-1"
              placeholder="type ID here..."
              value={ID}
              onChange={handleIDChange}
            />
          </div>
        )}

        <div className="flex flex-row gap-2">
          <button
            className="w-1/2 p-2 rounded-md border-brand border text-brand"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="w-1/2 bg-brand p-2 rounded-md text-white" onClick={handleAddClick}>
            Add
          </button>
        </div>
      </div>
    </CustomModal>
  )
}

export default AddNameModal
