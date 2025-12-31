import mongoose from 'mongoose'

import { DB_MODEL_NAMES } from '../../config/vars'
import ProjectModel from '../projects/project.model'

export type OrganizationType = {
  id: string
  _id: mongoose.Types.ObjectId
  name: string
  orgadmin: mongoose.Types.ObjectId
  users: mongoose.Types.ObjectId[]
  projects: mongoose.Types.ObjectId[]
}

const organizationSchema = new mongoose.Schema<OrganizationType>(
  {
    name: { type: String, unique: true, required: true },
    orgadmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.User,
    },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: DB_MODEL_NAMES.User }],
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

organizationSchema.pre(
  ['findOneAndDelete', 'findOneAndRemove', 'remove'],
  { document: true, query: false },
  async function (next) {
    try {
      // @ts-ignore
      await ProjectModel.deleteMany({ _id: { $in: this.projects } })
      next()
    } catch (err) {
      // @ts-ignore
      next(err)
    }
  }
)

const OrganizationModel = mongoose.model(
  DB_MODEL_NAMES.Organization,
  organizationSchema
)
export default OrganizationModel
