import mongoose from 'mongoose'

import { DB_MODEL_NAMES } from '../../config/vars'

export const inviteRoles = ['datamanager', 'reviewer', 'annotator'] as const
export type InviteRoleType = (typeof inviteRoles)[number]

export const inviteStatus = ['pending', 'accepted', 'declined'] as const
export type InviteStatusType = (typeof inviteStatus)[number]

export type InvitationType = {
  id: string
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  role: InviteRoleType
  inviter: mongoose.Types.ObjectId
  invitee: mongoose.Types.ObjectId
  status: InviteStatusType
}

const inviteSchema = new mongoose.Schema<InvitationType>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Project,
      required: true,
    },
    role: { type: String, enum: inviteRoles, required: true },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.User,
      required: true,
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.User,
      required: true,
    },
    status: { type: String, enum: inviteStatus, default: 'pending' },
  },
  {
    timestamps: true,
    id: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
      },
    },
  }
)

const InvitationModel = mongoose.model(DB_MODEL_NAMES.Invitation, inviteSchema)
export default InvitationModel
