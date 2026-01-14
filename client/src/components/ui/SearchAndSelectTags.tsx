import { FC, useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import { MultiValue } from 'react-select'
import { useParams } from 'react-router-dom'

import * as annotationClassesService from '@/services/supabase/annotationClasses.service'
import AnnotationClass from '@models/AnnotationClass.model'
import { cn } from '@renderer/utils/cn'

type SearchAndSelectTagsProps = {
  className?: string
  value: AnnotationClass[]
  onChange: (value: MultiValue<AnnotationClass>) => void
}

const SearchAndSelectTags: FC<SearchAndSelectTagsProps> = ({ value, onChange, className }) => {
  const [searchTagList, setSearchTagList] = useState<AnnotationClass[]>([])
  const { projectid: projectId } = useParams()

  const fetchAndSetTags = async (val: string) => {
    if (!projectId) return []
    const results = await annotationClassesService.searchAnnotationClasses(projectId, {
      skip: 0,
      limit: 20,
      name: val
    })
    // Transform snake_case to camelCase
    const tags: AnnotationClass[] = results.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      notes: r.notes || '',
      attributes: r.attributes || [],
      text: r.has_text || false,
      ID: r.has_id || false,
      orgId: r.org_id,
      projectId: r.project_id,
      createdAt: r.created_at || '',
      modifiedAt: r.updated_at || r.created_at || ''
    }))
    setSearchTagList(tags)
    return tags
  }

  useEffect(() => {
    fetchAndSetTags('')
  }, [])

  return (
    <AsyncSelect
      isMulti
      defaultValue={value}
      value={value}
      getOptionLabel={(option) => option.name}
      getOptionValue={(option) => option.id}
      defaultOptions={searchTagList}
      options={searchTagList}
      loadOptions={fetchAndSetTags}
      className={cn('w-full', className)}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onChange={onChange}
      styles={{
        option(base, { isSelected }) {
          return {
            ...base,
            cursor: 'pointer',
            color: isSelected ? 'white' : '#043c4a',
            backgroundColor: isSelected ? '#1c827f' : 'white',

            ':hover': {
              ...base[':active'],
              backgroundColor: isSelected ? '#1c827f' : 'rgb(28, 130, 127, 0.1)'
            }
          }
        },
        singleValue(base) {
          return { ...base, color: '#043c4a' }
        },
        input(base) {
          return { ...base, color: '#043c4a' }
        }
      }}
    />
  )
}

export default SearchAndSelectTags
