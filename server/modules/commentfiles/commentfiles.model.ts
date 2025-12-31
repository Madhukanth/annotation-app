import mongoose, { MongooseError } from 'mongoose'
import path from 'path'
import fse from 'fs-extra'

import envs, { DB_MODEL_NAMES } from '../../config/vars'
import { Storage, storageValues } from '../projects/project.model'

const commentFleTypes = ['image', 'video'] as const
export type CommentFileTypesType = (typeof commentFleTypes)[number]

export type CommentFile = {
  id: string
  _id: mongoose.Types.ObjectId
  name: string
  storedIn: Storage
  originalName: string
  orgId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  fileId: mongoose.Types.ObjectId
  commentId: mongoose.Types.ObjectId
  relativeUrl: string
  url: string
  type: CommentFileTypesType
}

const commentFileSchema = new mongoose.Schema<CommentFile>(
  {
    name: { type: String },
    originalName: { type: String },
    storedIn: { type: String, enum: storageValues, default: 'default' },
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
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Comment,
    },
    url: { type: String },
    relativeUrl: { type: String },
    type: { type: String, enum: commentFleTypes },
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

commentFileSchema.pre<CommentFile>(
  'deleteOne',
  { document: true },
  async function (next) {
    try {
      const commentFilePath = path.join(envs.DATA_ROOT!, this.relativeUrl)
      const fileExist = await fse.pathExists(commentFilePath)
      if (fileExist) {
        await fse.remove(commentFilePath)
      }

      next()
    } catch (err) {
      next(err as MongooseError)
    }
  }
)

const CommentFileModel = mongoose.model(
  DB_MODEL_NAMES.CommentFile,
  commentFileSchema
)
export default CommentFileModel
