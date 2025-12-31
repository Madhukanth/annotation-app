import mongoose from 'mongoose'
import type { MongooseError } from 'mongoose'
import path from 'path'
import fse from 'fs-extra'

import envs, { DB_MODEL_NAMES } from '../../config/vars'
import FileModel from '../files/file.model'
import ActionModel from '../action/action.model'
import CommentModel from '../comments/comments.model'
import CommentFileModel from '../commentfiles/commentfiles.model'
import InvitationModel from '../invitations/invitation.model'
import ShapeModel from '../shapes/shapes.model'

export const storageValues = ['aws', 'azure', 'default'] as const
export type Storage = (typeof storageValues)[number]

export const taskValues = ['classification', 'object-annotation'] as const
export type Task = (typeof taskValues)[number]

export type ProjectType = {
  _id: mongoose.Types.ObjectId
  id: string
  name: string
  orgId: mongoose.Types.ObjectId
  dataManagers: mongoose.Types.ObjectId[]
  taskType: Task
  reviewers: string[]
  annotators: string[]
  instructions: string
  storage: Storage
  azureStorageAccount: string
  azurePassKey: string
  azureContainerName: string
  awsSecretAccessKey: string
  awsAccessKeyId: string
  awsRegion: string
  awsApiVersion: string
  awsBucketName: string
  isSyncing: boolean
  syncedAt: Date
  defaultClassId: mongoose.Types.ObjectId | string | null
  prefix?: string
}

// A single org can have multiple projects and multiple orgadmins
// Each project can have multiple project owners, annotators and reviewers
// Each group can have multiple admins, annotators and reviewers
// Each user profile can have list of orgs

const projectSchema = new mongoose.Schema<ProjectType>(
  {
    name: { type: String, required: true },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Organization,
    },
    taskType: { type: String, enum: taskValues, required: true },
    dataManagers: [
      { type: mongoose.Schema.Types.ObjectId, ref: DB_MODEL_NAMES.User },
    ], // Edit or delete datasets
    reviewers: [
      { type: mongoose.Schema.Types.ObjectId, ref: DB_MODEL_NAMES.User },
    ],
    annotators: [
      { type: mongoose.Schema.Types.ObjectId, ref: DB_MODEL_NAMES.User },
    ],
    instructions: { type: String },
    storage: { type: String, enum: storageValues, required: true },
    awsSecretAccessKey: { type: String },
    awsAccessKeyId: { type: String },
    awsRegion: { type: String },
    awsApiVersion: { type: String },
    awsBucketName: { type: String },
    azureStorageAccount: { type: String },
    azurePassKey: { type: String },
    azureContainerName: { type: String },
    isSyncing: { type: Boolean, default: false },
    syncedAt: { type: Date, default: new Date() },
    defaultClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.AnnotationClass,
      default: null,
    },
    prefix: { type: String },
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

projectSchema.pre<ProjectType>(
  'deleteOne',
  { document: true },
  async function (next) {
    try {
      // Delete Actions associated
      await ActionModel.deleteMany({ projectId: this._id })

      // Delete comment files associated
      await CommentFileModel.deleteMany({ projectId: this._id })

      // Delete comments associated
      await CommentModel.deleteMany({ projectId: this._id })

      // Delete files associated
      await FileModel.deleteMany({ projectId: this._id })

      // Delete Invitation associated
      await InvitationModel.deleteMany({ projectId: this._id })

      // Delete shapes associated
      await ShapeModel.deleteMany({ projectId: this._id })

      // Delete entire project folder
      const projectFolder = path.join(
        envs.DATA_ROOT!,
        'orgs',
        this.orgId.toString(),
        'projects',
        this._id.toString()
      )
      const pathExist = await fse.pathExists(projectFolder)
      if (pathExist) {
        await fse.remove(projectFolder)
      }

      next()
    } catch (err) {
      next(err as MongooseError)
    }
  }
)

const ProjectModel = mongoose.model(DB_MODEL_NAMES.Project, projectSchema)
export default ProjectModel
