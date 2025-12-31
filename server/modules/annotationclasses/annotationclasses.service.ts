import httpStatus from 'http-status'
import APIError from '../../errors/api-error'
import { getObjectId } from '../../utils/db'
import ShapeModel from '../shapes/shapes.model'
import AnnotationClassModel, {
  AnnotationClass,
} from './annotationclasses.model'
import ProjectModel from '../projects/project.model'

export const dbCreateManyAnnotationClasses = async (
  annotationClassesData: Omit<Omit<AnnotationClass, 'id'>, '_id'>[]
) => {
  for (const cls of annotationClassesData) {
    await dbCreateAnnotationClass(cls)
  }
}

export const dbCreateAnnotationClass = async (
  annotationClassData: Omit<Omit<AnnotationClass, 'id'>, '_id'>
) => {
  const { orgId, projectId, name } = annotationClassData
  const classExist = await AnnotationClassModel.findOne({
    orgId: getObjectId(orgId.toString()),
    projectId: getObjectId(projectId.toString()),
    name,
  })
  if (classExist) {
    throw new APIError(
      `Class with name ${name} already exist`,
      httpStatus.BAD_REQUEST
    )
  }

  const doc = await AnnotationClassModel.create({ ...annotationClassData })
  return doc
}

export const dbGetAnnotationClasses = async (
  orgId: string,
  projectId: string,
  skip: number,
  limit: number,
  name?: string
) => {
  const query: { [field: string]: any } = {
    orgId: getObjectId(orgId),
    projectId: getObjectId(projectId),
  }

  if (name) {
    query['name'] = { $regex: name, $options: 'i' }
  }

  const docs = await AnnotationClassModel.find(query).skip(skip).limit(limit)
  return docs
}

export const dbUpdateAnnotationClass = async (
  orgId: string,
  projectId: string,
  classId: string,
  data: Partial<AnnotationClass>
) => {
  if (data.name) {
    const duplicateName = await AnnotationClassModel.findOne({
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      name: data.name,
    })

    if (duplicateName && duplicateName._id.toString() !== classId) {
      throw new APIError(
        `Class with name ${data.name} already exist`,
        httpStatus.BAD_REQUEST
      )
    }
  }

  const doc = await AnnotationClassModel.findOneAndUpdate(
    { _id: getObjectId(classId) },
    { ...data }
  )
  if (!doc) return null

  const updatedDoc = await AnnotationClassModel.findOne({
    _id: getObjectId(classId),
  })
  if (!updatedDoc) return null

  const deletedAttributes: string[] = []
  const oldDoc = doc.toJSON()
  const newDoc = updatedDoc.toJSON()
  for (const oAttr of oldDoc.attributes) {
    if (!newDoc.attributes.includes(oAttr)) {
      deletedAttributes.push(oAttr)
    }
  }

  const unsetFields: { [key: string]: string } = {}
  if (!newDoc.text) {
    unsetFields['text'] = ''
  }

  if (!newDoc.ID) {
    unsetFields['ID'] = ''
  }

  if (newDoc.attributes.length === 0) {
    unsetFields['attribute'] = ''
  }

  await ShapeModel.updateMany(
    { classId: getObjectId(classId) },
    { $unset: { ...unsetFields }, $set: { stroke: newDoc.color } }
  )

  if (deletedAttributes.length > 0) {
    await ShapeModel.updateMany(
      { classId: getObjectId(classId), attribute: { $in: deletedAttributes } },
      { $unset: { attribute: '' } }
    )
  }

  return updatedDoc
}

export const dbDeleteAnnotationClass = async (classId: string) => {
  const doc = await AnnotationClassModel.findOne({ _id: getObjectId(classId) })
  if (!doc) return null

  await doc.deleteOne()
  await ShapeModel.updateMany(
    { classId: getObjectId(classId) },
    {
      $unset: { classId: '', attribute: '', text: '', ID: '' },
      $set: { stroke: 'rgb(255, 0, 0)' },
    }
  )

  const classList = await AnnotationClassModel.find({
    projectId: doc.projectId,
  })
  if (classList.length === 0) {
    await ProjectModel.findOneAndUpdate(
      { _id: doc.projectId },
      { $set: { defaultClassId: null } }
    )
  }
  return doc
}

export const dbGetAnnotationClassByNames = async (
  orgId: string,
  projectId: string,
  name: string[]
) => {
  const docs = await AnnotationClassModel.find(
    {
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      name: { $in: name },
    },
    { _id: 1 }
  )
  return docs
}
