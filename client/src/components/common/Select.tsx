import { SelectOption } from '@models/UI.model'
import { cn } from '@renderer/utils/cn'
import { FC } from 'react'
import Select, { SingleValue } from 'react-select'

type CustomSelectProps = {
  classname?: string
  name?: string
  disabled?: boolean
  value: SingleValue<SelectOption>
  options: SelectOption[]
  onChange: (value: SingleValue<SelectOption>) => void
}
const CustomSelect: FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  classname,
  name,
  disabled = false
}) => {
  return (
    <Select
      isDisabled={disabled}
      name={name}
      className={cn('text-brand1 capitalize min-w-[150px]', classname)}
      value={value}
      isClearable={false}
      isSearchable={false}
      options={options}
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
        }
      }}
    />
  )
}

export default CustomSelect
