import { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'

import * as AnnotationClassValidation from './annotationclasses.validation'
import * as AnnotationClassService from './annotationclasses.service'
import { getObjectId } from '../../utils/db'

export const createAnnotationClassController = async (
  req: Request<
    AnnotationClassValidation.HasOrgIdAndProjectIdParams,
    {},
    AnnotationClassValidation.CreateAnnotationClassBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId } = req.params
    const { name, ID, attributes, text, color, notes } = req.body

    const annotationClass =
      await AnnotationClassService.dbCreateAnnotationClass({
        name,
        ID,
        attributes,
        text,
        orgId: getObjectId(orgId),
        projectId: getObjectId(projectId),
        color,
        notes,
      })

    return res.status(httpStatus.CREATED).json(annotationClass.toJSON())
  } catch (err) {
    next(err)
  }
}

export const getAnnotationClassesController = async (
  req: Request<
    AnnotationClassValidation.HasOrgIdAndProjectIdParams,
    {},
    {},
    AnnotationClassValidation.GetAnnotationClassesQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId } = req.params
    const { name, skip, limit } = req.query
    const annotationClassDocs =
      await AnnotationClassService.dbGetAnnotationClasses(
        orgId,
        projectId,
        skip,
        limit,
        name
      )

    const annotationClassesJson = annotationClassDocs.map((a) => a.toJSON())
    return res.status(httpStatus.OK).json(annotationClassesJson)
  } catch (err) {
    next(err)
  }
}

export const updateAnnotationClassController = async (
  req: Request<
    AnnotationClassValidation.UpdateAnnotationClassParams,
    {},
    AnnotationClassValidation.UpdateAnnotationClassBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classid: classId, orgid: orgId, projectid: projectId } = req.params
    const { name, ID, attributes, text, color, notes } = req.body
    const updatedDoc = await AnnotationClassService.dbUpdateAnnotationClass(
      orgId,
      projectId,
      classId,
      { name, ID, attributes, text, color, notes }
    )
    if (!updatedDoc) {
      throw new Error('Annotation Class not found')
    }

    return res.status(httpStatus.OK).json(updatedDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const deleteAnnotationClassController = async (
  req: Request<AnnotationClassValidation.HasClassIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classid: classId } = req.params
    const doc = await AnnotationClassService.dbDeleteAnnotationClass(classId)
    if (!doc) {
      throw new Error('Annotation Class not found')
    }

    return res.status(httpStatus.OK).json(doc.toJSON())
  } catch (err) {
    next(err)
  }
}
