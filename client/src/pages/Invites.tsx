import Button from '@renderer/components/common/Button'
import { errorNotification } from '@renderer/components/common/Notification'
import OutlineButton from '@renderer/components/common/OutlineButton'
import { fetchReceivedInvites, updateInvite } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FC } from 'react'
import { useNavigate } from 'react-router-dom'

const Invites: FC = () => {
  const currentUser = useUserStore((s) => s.user)
  const { data: inviteList } = useQuery(
    ['invites', { userId: currentUser!.id }],
    fetchReceivedInvites,
    { enabled: !!currentUser, initialData: [] }
  )
  const orgId = useOrgStore((s) => s.selectedOrg)
  const navigate = useNavigate()

  const queryClient = useQueryClient()
  const { mutate: updateMutate, isLoading } = useMutation(updateInvite, {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      navigate(`/orgs/${orgId}/projects`)
    },
    onError() {
      errorNotification('Failed to update the invitation')
    }
  })

  return (
    <div className="h-full w-full flex flex-col pb-6 px-6 pt-6">
      <div className="py-4">
        <p className="text-xl">Invites</p>
      </div>

      <div className="bg-white rounded-lg p-6 flex-grow">
        <p className="text-xl">Pending Invites</p>
        <div className="mt-4 grid grid-cols-1 overflow-hidden">
          <table className="flex flex-row flex-nowrap sm:bg-white sm:inline-table">
            <thead className="hidden sm:table-header-group d-md-table-header-group text-left text-gray-400">
              <tr>
                <th className="sm:w-1/5 md:w-1/5 lg:w-1/5 d-sm-none d-md-table-cell">
                  Organization Name
                </th>
                <th className="sm:w-1/5 md:w-1/5 lg:w-1/5 d-sm-none d-md-table-cell">
                  Project Name
                </th>
                <th className="sm:w-1/5 md:w-1/5 lg:w-1/5 d-sm-none d-md-table-cell">Role</th>
                <th className="sm:w-1/5 md:w-1/5 lg:w-1/5 d-sm-none d-md-table-cell">Invited By</th>
                <th className="sm:w-1/5 md:w-1/5 lg:w-1/5 d-sm-none d-md-table-cell"></th>
              </tr>
            </thead>
            <tbody className="sm:table-header-group">
              {inviteList.map((invite) => (
                <tr
                  className="inline-grid grid-cols-2 border-b sm:border-none sm:table-row mb-2 sm:mb-0"
                  key={invite.id}
                >
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400">Name</th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left">
                    {invite.projectId.orgId.name}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400">Email</th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left overflow-hidden text-ellipsis">
                    {invite.projectId.name}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400">Role</th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left capitalize">
                    {invite.role}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400">Invited By</th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left capitalize">
                    {invite.inviter.name}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400"></th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left">
                    <OutlineButton
                      disabled={isLoading}
                      onClick={() =>
                        updateMutate({
                          orgId: invite.projectId.orgId.id,
                          projectId: invite.projectId.id,
                          inviteId: invite.id,
                          status: 'declined'
                        })
                      }
                      className="rounded-lg text-base h-10 mr-6 border-red-500 text-red-500"
                    >
                      Decline
                    </OutlineButton>
                    <Button
                      className="h-10"
                      disabled={isLoading}
                      onClick={() =>
                        updateMutate({
                          orgId: invite.projectId.orgId.id,
                          projectId: invite.projectId.id,
                          inviteId: invite.id,
                          status: 'accepted'
                        })
                      }
                    >
                      Accept
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {inviteList.length === 0 && (
            <div className="md:text-center lg:text-center mt-5">No Invites</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Invites
