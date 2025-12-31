import mongoose, { MongooseError } from 'mongoose'
import path from 'path'
import fse from 'fs-extra'

import envs, { DB_MODEL_NAMES } from '../../config/vars'
import ActionModel from '../action/action.model'
import CommentModel from '../comments/comments.model'
import CommentFileModel from '../commentfiles/commentfiles.model'
import { Storage, storageValues } from '../projects/project.model'
import ShapeModel from '../shapes/shapes.model'

export const fileTypes = ['image', 'video'] as const
export type FileTypesType = (typeof fileTypes)[number]

export type FileType = {
  _id: mongoose.Types.ObjectId
  id: string
  originalName: string
  relativePath: string
  storedIn: Storage
  name: string
  url: string
  orgId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  type: FileTypesType
  tags: mongoose.Types.ObjectId[] // Used by classification projects
  annotator: mongoose.Types.ObjectId | null
  assignedAt: Date | null
  complete: boolean
  fps: number
  totalFrames: number
  duration: number
  hasShapes: boolean
  annotatedAt: Date | null
  skipped: boolean
  completedAt?: Date
  skippedAt?: Date
  height?: number
  width?: number
}

const fileSchema = new mongoose.Schema<FileType>(
  {
    originalName: { type: String },
    name: { type: String },
    url: { type: String },
    relativePath: { type: String },
    storedIn: { type: String, enum: storageValues, default: 'default' },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Organization,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Project,
    },
    type: { type: String, enum: fileTypes },
    annotator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.User,
      default: null,
    },
    assignedAt: { type: Date, default: null },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: DB_MODEL_NAMES.AnnotationClass,
        default: [],
      },
    ],
    complete: { type: Boolean, default: false },
    totalFrames: { type: Number, default: 1 },
    fps: { type: Number, default: 1 },
    duration: { type: Number, default: 0 },
    hasShapes: { type: Boolean, default: false },
    annotatedAt: { type: Date, default: null },
    skipped: { type: Boolean, default: false },
    completedAt: { type: Date },
    skippedAt: { type: Date },
    height: { type: Number },
    width: { type: Number },
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

fileSchema.pre<FileType>(
  'deleteOne', // /^(deleteOne|deleteMany)/,
  { document: true },
  async function (next) {
    try {
      // Delete Actions associated
      await ActionModel.deleteMany({ fileId: this._id })

      // Delete comment files associated
      await CommentFileModel.deleteMany({ fileId: this._id })

      // Delete comments associated
      await CommentModel.deleteMany({ fileId: this._id })

      // Delete shapes associated
      await ShapeModel.deleteMany({ fileId: this._id })

      // Delete file folder
      const fileAbsPath = path.join(envs.DATA_ROOT!, this.relativePath)
      const fileExist = await fse.pathExists(fileAbsPath)
      if (fileExist) {
        await fse.remove(fileAbsPath)
      }

      // Delete the files _id folder
      const fileFolder = path.join(
        path.dirname(fileAbsPath),
        this._id.toString()
      )
      const fileFolderExist = await fse.pathExists(fileFolder)
      if (fileFolderExist) {
        await fse.remove(fileFolder)
      }

      next()
    } catch (err) {
      next(err as MongooseError)
    }
  }
)

fileSchema.index({
  createdAt: 1,
  annotator: 1,
  completed: 1,
  skipped: 1,
  completedAt: 1,
  skippedAt: 1,
})
fileSchema.index({ projectId: 1 })

const FileModel = mongoose.model(DB_MODEL_NAMES.File, fileSchema)
export default FileModel
