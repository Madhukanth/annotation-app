import { getObjectId } from '../../utils/db'
import ShapeModel, { ShapeType } from './shapes.model'
import * as ActionService from '../action/action.service'
import * as FileService from '../files/file.service'
import AnnotationClassModel from '../annotationclasses/annotationclasses.model'

export const dbCreateShape = async (
  orgId: string,
  projectId: string,
  fileId: string,
  userId: string,
  newShape: ShapeType
) => {
  if (newShape.classId) {
    const classDoc = await AnnotationClassModel.findOne({
      _id: newShape.classId,
    })
    if (classDoc) {
      newShape.stroke = classDoc.color
    }
  }

  const doc = await ShapeModel.create({ ...newShape })
  await FileService.updateHasShapes(fileId, true)
  return doc
}

export const dbUpdateShape = async (
  orgId: string,
  projectId: string,
  fileId: string,
  userId: string,
  shapeId: string,
  partialData: Partial<ShapeType>
) => {
  if (partialData.classId) {
    const classDoc = await AnnotationClassModel.findOne({
      _id: partialData.classId,
    })
    if (classDoc) {
      partialData.stroke = classDoc.color
    }
  }

  const doc = await ShapeModel.findOneAndUpdate(
    { _id: getObjectId(shapeId) },
    { ...partialData }
  )
  if (!doc) return null

  const updatedDoc = await ShapeModel.findOne({ _id: getObjectId(shapeId) })
  await FileService.updateHasShapes(fileId, true)
  return updatedDoc
}

export const dbDeleteShape = async (shapeId: string) => {
  const doc = await ShapeModel.findOne({ _id: getObjectId(shapeId) })
  if (!doc) return null

  await doc.deleteOne()

  const allFileShapes = await ShapeModel.find({ fileId: doc.fileId })
  if (allFileShapes.length === 0) {
    await FileService.updateHasShapes(doc.toJSON().fileId.toString(), false)
  }
  return doc
}

export const dbGetShapes = async (
  orgId: string,
  projectId: string,
  fileId: string
) => {
  const shapeDocs = await ShapeModel.find({ fileId: getObjectId(fileId) })
  return shapeDocs
}
