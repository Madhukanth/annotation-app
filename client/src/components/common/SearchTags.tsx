import { ChangeEventHandler, FC, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import AnnotationClass from '@models/AnnotationClass.model'
import { searchTags } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'

type SearchTagsProps = {
  setTags: (classes: AnnotationClass[]) => void
  setIsFetching: (val: boolean) => void
}
const SearchTags: FC<SearchTagsProps> = ({ setTags, setIsFetching }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const orgId = useOrgStore((state) => state.selectedOrg)
  const { projectid: projectId } = useParams()

  useEffect(() => {
    fetchTags('')
  }, [])

  const fetchTags = async (val: string) => {
    setIsFetching(true)
    const tags = await searchTags(orgId!, projectId!, {
      skip: '0',
      limit: '50',
      name: val
    })
    setIsFetching(false)
    setTags(tags)
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
