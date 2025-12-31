import { FC, useState } from 'react'
import { SingleValue, MultiValue } from 'react-select'
import { IoMdTrash } from 'react-icons/io'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addMemberToProject,
  fetchProjectUsers,
  removeUserFromProject,
  revertImages
} from '@renderer/helpers/axiosRequests'
import { InviteRoleType, UserType, inviteRoles, useUserStore } from '@renderer/store/user.store'
import Button from '@renderer/components/common/Button'
import { useOrgStore } from '@renderer/store/organization.store'
import {
  errorNotification,
  successNotification,
  warningNotification
} from '@renderer/components/common/Notification'
import SearchAndSelectUsers from '@renderer/components/common/SearchUsers'
import CustomSelect from '@renderer/components/common/Select'
import { SelectOption } from '@models/UI.model'
import CustomModal from '@renderer/components/common/CustomModal'
import ConfirmDelete from '@renderer/components/common/ConfirmDelete'
import ConfirmMessage from '@renderer/components/common/ConfirmMessage'
import { useProjectStore } from '@renderer/store/project.store'
import { useParams } from 'react-router-dom'

const ProjectMembers: FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<SelectOption[]>([])
  const [selectedRole, setSelectedRole] = useState<InviteRoleType>(inviteRoles[0])
  const [delUser, setDelUser] = useState<UserType | null>(null)
  const [revertUser, setRevertUser] = useState<UserType | null>(null)
  const { projectid: projectId } = useParams()
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)

  const selectedOrg = useOrgStore((s) => s.selectedOrg)
  const currentUser = useUserStore((s) => s.user)
  const queryClient = useQueryClient()

  const { mutate: removeUserMutate, isLoading: isDeletingUser } = useMutation(
    removeUserFromProject,
    {
      onSuccess(deletedUserId: string) {
        successNotification('User removed from project')
        setDelUser(null)
        if (!project) return
        queryClient.setQueryData(
          ['project-users', { orgId: selectedOrg!, projectId: project.id }],
          (
            data:
              | {
                  dataManagers: UserType[]
                  annotators: UserType[]
                  reviewers: UserType[]
                }
              | undefined
          ) => {
            if (!data) return data
            return {
              dataManagers: data.dataManagers.filter((u) => u.id !== deletedUserId),
              annotators: data.annotators.filter((u) => u.id !== deletedUserId),
              reviewers: data.reviewers.filter((u) => u.id !== deletedUserId)
            }
          }
        )
      },
      onError() {
        errorNotification('Failed to remove user from project')
      }
    }
  )

  const { mutate: revertImagesMutate, isLoading: isReverting } = useMutation(revertImages, {
    onSuccess() {
      setRevertUser(null)
      successNotification('Images reverted successfully')
    },
    onError() {
      errorNotification('Failed to revert images')
    }
  })

  const { isLoading: isAdding, mutate: addMemberMutate } = useMutation(addMemberToProject, {
    onSuccess: () => {
      setSelectedUsers([])
      setSelectedRole(inviteRoles[0])
      queryClient.invalidateQueries(['project-users'])
    }
  })

  const { data: projectUsers } = useQuery(
    ['project-users', { orgId: selectedOrg!, projectId: project!.id }],
    fetchProjectUsers,
    { initialData: null, enabled: !!selectedOrg && !!currentUser && !!project }
  )

  const handleUserSelect = (val: MultiValue<SelectOption>) => {
    setSelectedUsers(val as SelectOption[])
  }

  const handleRoleSelect = (
    val: SingleValue<{
      value: string | undefined
      label: string | undefined
    }>
  ) => {
    setSelectedRole((val?.value as InviteRoleType) || inviteRoles[0])
  }

  const handleInvite = () => {
    if (!currentUser || !selectedOrg || !project) return

    if (selectedUsers.length === 0) {
      warningNotification('Please select users to invite')
      return
    }

    addMemberMutate({
      orgId: selectedOrg,
      projectId: project.id,
      userIds: selectedUsers.map(({ value }) => value),
      role: selectedRole
    })
  }

  if (!project) {
    return <div>Project not found</div>
  }

  const inviteRoleOptions = inviteRoles.map((v) => ({ value: v, label: v }))
  return (
    <div className="h-full overflow-scroll">
      {!!delUser && (
        <CustomModal isOpen closeModal={() => setDelUser(null)}>
          <ConfirmDelete
            name={`user "${delUser.name}"`}
            loading={isDeletingUser}
            onCancel={() => setDelUser(null)}
            onDelete={() => {
              removeUserMutate({ orgId: selectedOrg!, projectId: project.id, userId: delUser.id })
            }}
          />
        </CustomModal>
      )}

      {!!revertUser && (
        <CustomModal isOpen closeModal={() => setRevertUser(null)}>
          <ConfirmMessage
            text={`Are you sure you want to revert images from user "${revertUser.name}"`}
            loading={isReverting}
            onCancel={() => setRevertUser(null)}
            onSubmit={() => {
              revertImagesMutate({
                orgId: selectedOrg!,
                projectId: project.id,
                userId: revertUser.id
              })
            }}
          />
        </CustomModal>
      )}

      <p className="text-xl mb-4">Members</p>

      <div className="flex items-center gap-6 w-full flex-wrap">
        <div className="flex-grow">
          <p className="text-gray-400 text-base mb-2">Select users</p>
          <SearchAndSelectUsers
            filterCurrentUser
            isMulti
            value={selectedUsers}
            onChange={handleUserSelect}
          />
        </div>

        <div className="w-44">
          <p className="text-gray-400 text-base mb-2">Select role</p>

          <CustomSelect
            value={{ value: selectedRole, label: selectedRole }}
            options={inviteRoleOptions}
            onChange={handleRoleSelect}
          />
        </div>

        <div className="self-end">
          <Button onClick={handleInvite} disabled={isAdding} className="h-10">
            Add member
          </Button>
        </div>
      </div>

      <div className="mt-7">
        <div className="mt-4 grid grid-cols-1 overflow-scroll">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-start h-14 w-[22%] lg:w-auto">Name</th>
                <th className="text-start h-14">Email</th>
                <th className="text-start h-14">Role</th>
                <th className="text-start h-14"></th>
              </tr>
            </thead>
            <tbody className="border-b">
              {projectUsers?.dataManagers.map((user) => (
                <tr className="border-b last:border-none" key={user.id}>
                  <td className="h-16 pr-3">
                    {user.name}
                    {user.id === currentUser?.id ? ' (You)' : ''}
                  </td>

                  <td className="h-16 overflow-hidden text-ellipsis pr-5">{user.email}</td>

                  <td className="h-16 pr-3 w-[120px]">DataManager</td>

                  <td className="h-16">
                    <div className="flex items-center justify-end gap-5">
                      <button
                        disabled={isReverting}
                        onClick={() => setRevertUser(user)}
                        className="border-brand text-brand border w-32 py-2 px-2 rounded-lg justify-self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Revert Images
                      </button>

                      <button
                        disabled={projectUsers?.dataManagers.length === 1}
                        onClick={() => setDelUser(user)}
                        className="text-red-500 justify-self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoMdTrash size={25} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {projectUsers?.reviewers.map((user) => (
                <tr className="border-b last:border-none" key={user.id}>
                  <td className="h-16 pr-3">
                    {user.name}
                    {user.id === currentUser?.id ? ' (You)' : ''}
                  </td>

                  <td className="h-16 pr-5 overflow-hidden text-ellipsis">{user.email}</td>

                  <td className="h-16 pr-3 w-[120px]">Reviewer</td>

                  <td className="h-16">
                    <div className="flex items-center justify-end gap-5">
                      <button
                        disabled={isReverting}
                        onClick={() => setRevertUser(user)}
                        className="border-brand text-brand border w-32 py-2 px-2 rounded-lg justify-self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Revert Images
                      </button>

                      <button
                        onClick={() => setDelUser(user)}
                        className="text-red-500 justify-self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoMdTrash size={25} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {projectUsers?.annotators.map((user) => (
                <tr className="border-b last:border-none" key={user.id}>
                  <td className="h-16 pr-3">
                    {user.name}
                    {user.id === currentUser?.id ? ' (You)' : ''}
                  </td>

                  <td className="h-16 pr-5 overflow-hidden text-ellipsis">{user.email}</td>

                  <td className="h-16 pr-3 w-[120px]">Annotator</td>

                  <td className="h-16">
                    <div className="flex items-center justify-end gap-5">
                      <button
                        disabled={isReverting}
                        onClick={() => setRevertUser(user)}
                        className="border-brand text-brand border w-32 py-2 px-2 rounded-lg justify-self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Revert Images
                      </button>

                      <button
                        onClick={() => setDelUser(user)}
                        className="text-red-500 justify-self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoMdTrash size={25} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projectUsers?.dataManagers.length === 0 && (
            <div className="md:text-center lg:text-center mt-5">No Members</div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ProjectMembers
