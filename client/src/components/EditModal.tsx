import { ChangeEvent, FC, useEffect, useMemo, useState } from 'react'

import CustomModal from '@renderer/components/common/CustomModal'
import { useClassesStore } from '@renderer/store/classes.store'
import CustomSelect from './common/Select'
import { useParams } from 'react-router-dom'
import { useAnnotationClasses } from '@/hooks/useAnnotationClasses'

type EditModalProps = {
  isOpen: boolean
  name: string
  notes: string
  title: string
  shapeId?: string
  onAddPoints?: (polyId: string) => void
  onCancel: () => void
  onEdit: (
    name: string,
    notes: string,
    classId?: string,
    attribute?: string,
    text?: string,
    ID?: string,
    color?: string
  ) => void
  classId?: string
  attribute?: string
  text?: string
  ID?: string
}
const EditModal: FC<EditModalProps> = ({
  onCancel,
  onEdit,
  isOpen,
  name,
  notes,
  title,
  shapeId,
  onAddPoints,
  classId: initClassId,
  attribute: initAttribute,
  text: initText,
  ID: initID
}) => {
  const { projectid: projectId } = useParams()
  const setClasses = useClassesStore((s) => s.setClasses)
  const [newName, setName] = useState('')
  const [newNotes, setNotes] = useState('')
  const [selectedClassOpt, setSelectedClassOpt] = useState<{ label: string; value: string } | null>(
    null
  )
  const [selectedAttr, setSelectedAttr] = useState<{ label: string; value: string } | null>(null)
  const [text, setText] = useState('')
  const [ID, setID] = useState('')

  const { data: annotationClassesData = [] } = useAnnotationClasses(projectId || '')

  // Transform snake_case to camelCase for compatibility
  const classes = useMemo(
    () =>
      annotationClassesData.map((c) => ({
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
      })),
    [annotationClassesData]
  )

  const classSelectOptions = classes.map((c) => ({ label: c.name, value: c.id }))
  const selectedClass = selectedClassOpt
    ? classes.find((c) => c.id === selectedClassOpt.value)
    : null
  const attributeOptions = selectedClass
    ? selectedClass.attributes.map((a) => ({ label: a, value: a }))
    : []

  useEffect(() => {
    setClasses(classes)
  }, [classes])

  useEffect(() => {
    if (!initClassId) return

    const fClass = classes.find((c) => c.id === initClassId)
    if (!fClass) return

    setSelectedClassOpt({ value: fClass.id, label: fClass.name })
  }, [initClassId, classes])

  useEffect(() => {
    if (!initAttribute) return

    setSelectedAttr({ value: initAttribute, label: initAttribute })
  }, [initAttribute])

  useEffect(() => {
    if (!initText) return
    setText(initText)
  }, [initText])

  useEffect(() => {
    if (!initID) return
    setID(initID)
  }, [initID])

  useEffect(() => {
    setName(name)
    setNotes(notes)
  }, [name, notes])

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

  const handleEditClick = () => {
    onEdit(
      newName,
      newNotes,
      selectedClassOpt?.value || undefined,
      selectedAttr?.value,
      text,
      ID,
      selectedClass?.color
    )
    setName('')
    setNotes('')
    setSelectedAttr(null)
    setText('')
    setID('')
  }

  const handleAddPoints = () => {
    if (onAddPoints && shapeId) {
      onAddPoints(shapeId)
      onCancel()
    }
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
        <div className="flex flex-row justify-between items-center">
          <p className="text-center text-2xl">{title}</p>

          {onAddPoints && shapeId && (
            <button onClick={handleAddPoints} className="text-brand rounded-md">
              Add points
            </button>
          )}
        </div>

        <div>
          <label>Name</label>
          <input
            className="w-full p-2 border-gray-500 border rounded-md mt-1"
            placeholder="type name here..."
            value={newName}
            onChange={handleNameChange}
          />
        </div>

        <div>
          <label>Notes</label>
          <textarea
            className="resize-none w-full p-2 border-gray-500 border rounded-md mt-1"
            rows={4}
            placeholder="type notes here..."
            value={newNotes}
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

        <div className="grid grid-cols-2 gap-2">
          <button className="p-2 rounded-md border-brand border text-brand" onClick={onCancel}>
            Cancel
          </button>
          <button className="bg-brand p-2 rounded-md text-white" onClick={handleEditClick}>
            Save
          </button>
        </div>
      </div>
    </CustomModal>
  )
}

export default EditModal
