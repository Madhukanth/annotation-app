import { useFormik } from 'formik'
import { SingleValue } from 'react-select'
import { useQueryClient } from '@tanstack/react-query'

import { UserRoleType, UserType } from '@renderer/store/user.store'
import CustomSelect from '@/components/ui/Select'
import { useOrgStore } from '@renderer/store/organization.store'
import { FC, useEffect } from 'react'
import { errorNotification } from '@/components/ui/Notification'
import { useUpdateUser } from '@/hooks/useUsers'

type EditUserFormikType = {
  name: string
  email: string
  password: string
  role: UserRoleType
}

const DUMMY_PASSWORD = '*******'
const EditUser: FC<{ handleClose: () => void; user: UserType }> = ({ user, handleClose }) => {
  const queryClient = useQueryClient()
  const orgId = useOrgStore((s) => s.selectedOrg)
  const updateUserMutation = useUpdateUser()

  const formik = useFormik<EditUserFormikType>({
    initialValues: { email: '', password: '', name: '', role: 'user' },
    onSubmit: (values) => {
      if (!orgId) return

      const updateData = { name: values.name, email: values.email, role: values.role }
      updateUserMutation.mutate(
        {
          userId: user.id,
          input: updateData
        },
        {
          onSuccess() {
            formik.resetForm({
              values: { email: '', password: DUMMY_PASSWORD, name: '', role: 'user' }
            })
            queryClient.invalidateQueries({ queryKey: ['users'] })
            handleClose()
          },
          onError() {
            errorNotification('Unable to update user')
          }
        }
      )
    }
  })

  useEffect(() => {
    formik.setValues({
      email: user.email,
      name: user.name,
      role: user.role,
      password: DUMMY_PASSWORD
    })
  }, [user])

  const handleOrgChange = (
    selected: SingleValue<{
      value: string | undefined
      label: string | undefined
    }>
  ) => {
    if (selected?.value) {
      formik.setFieldValue('role', selected.value as UserRoleType)
    }
  }

  const roleOptions = [
    { value: 'orgadmin', label: 'Organization admin' },
    { value: 'user', label: 'User' }
  ]

  return (
    <div className="bg-white rounded-md p-5 w-[90vw] sm:w-96">
      <p className="text-xl">Add User</p>
      <div>
        <form className="flex flex-col pt-4" onSubmit={formik.handleSubmit}>
          <label className="text-gray-400" htmlFor="name">
            Name
          </label>
          <input
            required
            className="p-2 text-lg border-b border-b-gray-300"
            id="name"
            name="name"
            onChange={formik.handleChange}
            value={formik.values.name}
          />

          <label className="text-gray-400 mt-6" htmlFor="email">
            Email
          </label>
          <input
            className="p-2 text-lg border-b border-b-gray-300"
            id="email"
            name="email"
            type="email"
            required
            onChange={formik.handleChange}
            value={formik.values.email}
          />

          <label className="text-gray-400 mt-6" htmlFor="password">
            Password
          </label>
          <input
            className="p-2 text-lg border-b border-b-gray-300"
            id="password"
            name="password"
            type="password"
            onChange={formik.handleChange}
            value={formik.values.password}
          />

          <label className="text-gray-400 mt-6" htmlFor="password">
            Role
          </label>
          <CustomSelect
            value={{
              value: formik.values.role || '',
              label: roleOptions.find((role) => role.value === formik.values.role)?.label || ''
            }}
            options={[
              { value: 'orgadmin', label: 'Organization admin' },
              { value: 'user', label: 'User' }
            ]}
            onChange={handleOrgChange}
          />

          <div className="flex items-center gap-4">
            <button
              className="w-1/2 mt-12 bg-transparent border border-brand text-brand text-base p-2 rounded-md disabled:opacity-50"
              type="button"
              onClick={handleClose}
            >
              cancel
            </button>

            <button
              disabled={updateUserMutation.isLoading}
              className="w-1/2 mt-12 bg-brand text-white text-base p-2 rounded-md disabled:opacity-50"
              type="submit"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default EditUser
