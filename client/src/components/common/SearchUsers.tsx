import { FC, useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import { MultiValue, SingleValue } from 'react-select'

import { searchUsers } from '@renderer/helpers/axiosRequests'
import { useUserStore } from '@renderer/store/user.store'
import { SelectOption } from '@models/UI.model'

type SearchAndSelectUsersProps<TMultiple = boolean> = TMultiple extends true
  ? {
      isMulti: TMultiple
      value: SelectOption[]
      filterCurrentUser: boolean
      filterOtherThan?: string[]
      isClearable?: boolean
      onChange: (value: MultiValue<SelectOption>) => void
    }
  : {
      isMulti: TMultiple
      value: SelectOption
      filterCurrentUser: boolean
      filterOtherThan?: string[]
      isClearable?: boolean
      onChange: (value: SingleValue<SelectOption>) => void
    }
const SearchAndSelectUsers: FC<SearchAndSelectUsersProps> = ({
  isMulti,
  value,
  onChange,
  filterCurrentUser,
  filterOtherThan,
  isClearable = false
}) => {
  const [searchUserList, setSearchUserList] = useState<SelectOption[]>([])

  const { user: currentUser } = useUserStore()

  const fetchAndSetUsers = async (val: string) => {
    if (!currentUser) return []

    const users = await searchUsers(val)
    let filteredUsers = [...users]
    if (filterCurrentUser) {
      filteredUsers = users.filter((u) => filterCurrentUser && u.id !== currentUser.id)
    }

    if (filterOtherThan) {
      filteredUsers = filteredUsers.filter((u) => filterOtherThan.includes(u.id))
    }

    const userOptions = filteredUsers.map((u) => ({ value: u.id, label: u.name }))
    setSearchUserList(userOptions)
    return userOptions
  }

  useEffect(() => {
    fetchAndSetUsers('')
  }, [])

  return (
    <AsyncSelect
      isMulti={isMulti}
      defaultValue={value}
      value={value}
      defaultOptions={searchUserList}
      options={searchUserList}
      loadOptions={fetchAndSetUsers}
      isClearable={isClearable}
      className="w-full"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onChange={onChange}
      styles={{
        control(base) {
          return { ...base, border: '1px solid rgba(4, 60, 74, 0.14)' }
        },
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

export default SearchAndSelectUsers
