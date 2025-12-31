import mongoose from 'mongoose'

import { DB_MODEL_NAMES } from '../../config/vars'

export const actionNames = [
  'viewed',
  'annotated',
  'skipped',
  'mark_complete',
  'mark_incomplete',
  'classified',
] as const
export type ActionNameType = (typeof actionNames)[number]

export type ActionType = {
  id: string
  _id: mongoose.Types.ObjectId
  name: ActionNameType
  userId: mongoose.Types.ObjectId
  fileId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  shapeId?: mongoose.Types.ObjectId
  createdAt: string
  modifiedAt: string
}

const actionSchema = new mongoose.Schema<ActionType>(
  {
    name: { type: String, enum: actionNames, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.User,
      required: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.File,
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Project,
      required: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Organization,
      required: true,
    },
    shapeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Shape,
    },
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

const ActionModel = mongoose.model(DB_MODEL_NAMES.Action, actionSchema)
export default ActionModel
