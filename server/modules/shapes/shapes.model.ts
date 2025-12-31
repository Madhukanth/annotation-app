import mongoose from 'mongoose'

import { DB_MODEL_NAMES } from '../../config/vars'

export const shapesAvailable = [
  'polygon',
  'rectangle',
  'circle',
  'face',
  'line',
] as const
export type ShapesAvailableType = (typeof shapesAvailable)[number]

export type PointType = {
  id: string
  x: number
  y: number
}

export type ShapeType = {
  _id: mongoose.Types.ObjectId
  id: string
  type: ShapesAvailableType
  name: string
  notes: string
  stroke: string
  strokeWidth: number
  orgId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  fileId: mongoose.Types.ObjectId
  text?: string
  ID?: string
  attribute?: string
  classId?: mongoose.Types.ObjectId
  x?: number
  y?: number
  height?: number
  width?: number
  points?: PointType[]
  atFrame: number
}

const shapeSchema = new mongoose.Schema<ShapeType>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: shapesAvailable, required: true },
    notes: { type: String, default: '' },
    stroke: { type: String, default: 'red' },
    strokeWidth: { type: Number, default: 2 },
    x: { type: Number, required: false },
    y: { type: Number, required: false },
    height: { type: Number, required: false },
    width: { type: Number, required: false },
    points: [{ type: { x: Number, y: Number, id: String }, required: false }],
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Organization,
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.Project,
      required: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.File,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MODEL_NAMES.AnnotationClass,
      required: false,
    },
    text: { type: String, required: false },
    attribute: { type: String, required: false },
    ID: { type: String, required: false },
    atFrame: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    id: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        delete ret._id
      },
    },
  }
)

const ShapeModel = mongoose.model(DB_MODEL_NAMES.Shape, shapeSchema)
export default ShapeModel
