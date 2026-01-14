import Button from '@/components/ui/Button'
import { errorNotification } from '@/components/ui/Notification'
import OutlineButton from '@/components/ui/OutlineButton'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import { useQueryClient } from '@tanstack/react-query'
import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserInvitations, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useInvitations'

const Invites: FC = () => {
  const currentUser = useUserStore((s) => s.user)
  const { data: inviteList = [] } = useUserInvitations(currentUser?.id || '')
  const orgId = useOrgStore((s) => s.selectedOrg)
  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const acceptMutation = useAcceptInvitation()
  const declineMutation = useDeclineInvitation()

  const handleAccept = (invitationId: string) => {
    acceptMutation.mutate(invitationId, {
      onSuccess() {
        queryClient.invalidateQueries({ queryKey: ['organizations'] })
        queryClient.invalidateQueries({ queryKey: ['invitations'] })
        navigate(`/orgs/${orgId}/projects`)
      },
      onError() {
        errorNotification('Failed to accept the invitation')
      }
    })
  }

  const handleDecline = (invitationId: string) => {
    declineMutation.mutate(invitationId, {
      onSuccess() {
        queryClient.invalidateQueries({ queryKey: ['invitations'] })
      },
      onError() {
        errorNotification('Failed to decline the invitation')
      }
    })
  }

  const isLoading = acceptMutation.isLoading || declineMutation.isLoading

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
                    {(invite as any).projectId?.orgId?.name || invite.project?.org?.name || '-'}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400">Email</th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left overflow-hidden text-ellipsis">
                    {(invite as any).projectId?.name || invite.project?.name || '-'}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400">Role</th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left capitalize">
                    {invite.role}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400">Invited By</th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left capitalize">
                    {(invite as any).inviter?.name || invite.inviter?.name || '-'}
                  </td>
                  <th className="py-2 px-4 text-left sm:hidden text-gray-400"></th>
                  <td className="md:w-1/5 lg:md:w-1/5 p-3 md:p-0 d-sm-none d-md-table-cell lg:p-0 md:text-left">
                    <OutlineButton
                      disabled={isLoading}
                      onClick={() => handleDecline(invite.id)}
                      className="rounded-lg text-base h-10 mr-6 border-red-500 text-red-500"
                    >
                      Decline
                    </OutlineButton>
                    <Button
                      className="h-10"
                      disabled={isLoading}
                      onClick={() => handleAccept(invite.id)}
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
