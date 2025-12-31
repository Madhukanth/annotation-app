import mongoose from 'mongoose'
import { DB_MODEL_NAMES } from '../../config/vars'

export type AnnotationClass = {
  _id: mongoose.Types.ObjectId
  id: string
  name: string
  notes: string
  attributes: string[]
  text: boolean
  ID: boolean
  orgId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  color: string
}

const annotationClassSchema = new mongoose.Schema<AnnotationClass>(
  {
    name: { type: String, required: true },
    attributes: { type: [{ type: String }], default: [] },
    text: { type: Boolean, default: false },
    ID: { type: Boolean, default: false },
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
    color: { type: String, required: true },
    notes: { type: String, default: '' },
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

const AnnotationClassModel = mongoose.model(
  DB_MODEL_NAMES.AnnotationClass,
  annotationClassSchema
)
export default AnnotationClassModel
