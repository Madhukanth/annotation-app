import mongoose, { MongooseError } from 'mongoose'
import path from 'path'
import fse from 'fs-extra'

import envs, { DB_MODEL_NAMES } from '../../config/vars'
import CommentFileModel from '../commentfiles/commentfiles.model'

export type CommentType = {
  id: string
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  fileId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  shapeId?: string
  content: string
}

const commentSchema = new mongoose.Schema<CommentType>(
  {
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
    shapeId: { type: String },
    content: { type: String },
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

commentSchema.pre<CommentType>(
  'deleteOne',
  { document: true },
  async function (next) {
    try {
      // Delete all comment files associated
      await CommentFileModel.deleteMany({ commentId: this._id })

      // Delete the comment folder
      const commentFolder = path.join(
        envs.DATA_ROOT!,
        'orgs',
        this.orgId.toString(),
        'projects',
        this.projectId.toString(),
        'files',
        this.fileId.toString(),
        'comments',
        this._id.toString()
      )
      const folderExist = await fse.pathExists(commentFolder)
      if (folderExist) {
        await fse.remove(commentFolder)
      }

      next()
    } catch (err) {
      next(err as MongooseError)
    }
  }
)

const CommentModel = mongoose.model(DB_MODEL_NAMES.Comment, commentSchema)
export default CommentModel
