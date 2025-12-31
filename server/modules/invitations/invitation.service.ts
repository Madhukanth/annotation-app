import { getObjectId } from '../../utils/db'
import InvitationModel, {
  InviteRoleType,
  InviteStatusType,
} from './invitation.model'

export const dbCreateInvitation = async (
  projectId: string,
  inviter: string,
  invitee: string,
  role: InviteRoleType
) => {
  const inviteDoc = await InvitationModel.create({
    projectId: getObjectId(projectId),
    inviter: getObjectId(inviter),
    invitee: getObjectId(invitee),
    role: role,
  })
  return inviteDoc
}

export const dbGetInviteById = async (inviteId: string) => {
  const inviteDoc = await InvitationModel.findById(inviteId)
  return inviteDoc
}

export const dbDeleteInvitation = async (inviteId: string) => {
  const deletedInviteDoc = await InvitationModel.findOneAndDelete({
    _id: getObjectId(inviteId),
  })
  return deletedInviteDoc
}

export const dbUpdateInviteStatus = async (
  inviteId: string,
  status: InviteStatusType
) => {
  const updatedDoc = await InvitationModel.findOneAndUpdate(
    { _id: getObjectId(inviteId) },
    { status }
  )
  return updatedDoc
}

export const dbGetInvites = async ({
  projectId,
  inviteeId,
  inviterId,
  status,
}: {
  projectId?: string
  inviterId?: string
  inviteeId?: string
  status?: InviteStatusType
}) => {
  let query: { [key: string]: any } = {}

  if (projectId) {
    query['projectId'] = getObjectId(projectId)
  }

  if (inviterId) {
    query['inviter'] = getObjectId(inviterId)
  }

  if (inviteeId) {
    query['invitee'] = getObjectId(inviteeId)
  }

  if (status) {
    query['status'] = status
  }

  const docs = await InvitationModel.find(query)
    .populate({ path: 'invitee', select: { name: 1, email: 1, id: 1 } })
    .populate({ path: 'inviter', select: { name: 1, email: 1, id: 1 } })
    .populate({
      path: 'projectId',
      select: { name: 1, orgId: 1 },
      populate: { path: 'orgId', select: { name: 1 } },
    })

  return docs
}
