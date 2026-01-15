import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check, X, Mail } from 'lucide-react'

import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import { useUserInvitations, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useInvitations'
import { errorNotification } from '@/components/ui/Notification'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Invitations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your pending project invitations
        </p>
      </div>

      {/* Invites Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            Pending Invites
            {inviteList.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {inviteList.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inviteList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No pending invites</h3>
              <p className="text-muted-foreground text-sm">
                You don't have any pending project invitations
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inviteList.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      {invite.project?.org?.name || '-'}
                    </TableCell>
                    <TableCell>{invite.project?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {invite.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{invite.inviter?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleDecline(invite.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleAccept(invite.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Invites
