import { useState } from 'react'
import { MdModeEdit } from 'react-icons/md'
import { FaTrash } from 'react-icons/fa'

import Button from '@renderer/components/common/Button'
import AddUser from '@renderer/components/Admin/AddUser'
import CustomModal from '@renderer/components/common/CustomModal'
import EditUser from '@renderer/components/Admin/EditUser'
import { UserType } from '@renderer/store/user.store'
import { errorNotification } from '@renderer/components/common/Notification'
import { useUsers, useDeleteUser } from '@/hooks/useUsers'

const AdminPage = () => {
  const [showAddUser, setShowAddUser] = useState(false)
  const [editUser, setEditUser] = useState<UserType | null>(null)

  const { data: users = [] } = useUsers()
  const deleteUserMutation = useDeleteUser()

  const handleDelete = (userId: string) => {
    deleteUserMutation.mutate(userId, {
      onError() {
        errorNotification('Unable to delete user')
      }
    })
  }

  return (
    <div className="h-full w-full flex flex-col pb-6 px-6 pt-6">
      <CustomModal isOpen={showAddUser} closeModal={() => setShowAddUser(false)}>
        <AddUser handleClose={() => setShowAddUser(false)} />
      </CustomModal>

      <CustomModal isOpen={!!editUser} closeModal={() => setEditUser(null)}>
        <EditUser user={editUser!} handleClose={() => setEditUser(null)} />
      </CustomModal>

      <div className="bg-white rounded-lg p-6 flex-grow overflow-scroll">
        <div className="flex items-center gap-4 justify-between mb-6">
          <p className="text-xl">Manage Users</p>
          <Button className="p-2" onClick={() => setShowAddUser(true)}>
            Add user
          </Button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-start h-14">Name</th>
              <th className="text-start h-14">Email</th>
              <th className="text-start h-14">Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b" key={user.id}>
                <td className="h-14">{user.name}</td>
                <td className="h-14">{user.email}</td>
                <td className="h-14 capitalize">{user.role}</td>
                <td className="h-14">
                  <div className="flex items-center gap-2 justify-end">
                    <Button onClick={() => setEditUser(user)} className="bg-transparent text-brand">
                      <MdModeEdit size={23} />
                    </Button>
                    <Button
                      disabled={deleteUserMutation.isLoading}
                      onClick={() => handleDelete(user.id)}
                      className="bg-transparent text-red-500"
                    >
                      <FaTrash size={20} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPage
