import { ChangeEventHandler, FC, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import AnnotationClass from '@models/AnnotationClass.model'
import { annotationClassesService } from '@/services/supabase'

type SearchTagsProps = {
  setTags: (classes: AnnotationClass[]) => void
  setIsFetching: (val: boolean) => void
}
const SearchTags: FC<SearchTagsProps> = ({ setTags, setIsFetching }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const { projectid: projectId } = useParams()

  useEffect(() => {
    fetchTags('')
  }, [])

  const fetchTags = async (val: string) => {
    if (!projectId) return

    setIsFetching(true)
    try {
      const classes = await annotationClassesService.searchAnnotationClasses(projectId, {
        skip: 0,
        limit: 50,
        name: val || undefined
      })
      // Transform to legacy AnnotationClass format
      setTags(classes.map(c => ({
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
      })))
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchTerm(e.target.value)
    fetchTags(e.target.value)
  }

  return (
    <input
      value={searchTerm}
      onChange={handleInputChange}
      type="text"
      placeholder="type class name..."
      className="p-2 w-full border border-tertiary/40 border-solid rounded-lg"
    />
  )
}

export default SearchTags
