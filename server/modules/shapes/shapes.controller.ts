import { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'

import * as ShapeValidation from './shapes.validation'
import * as ShapeService from './shapes.service'
import { getObjectId } from '../../utils/db'

export const createShapeController = async (
  req: Request<
    ShapeValidation.HasOrgIdProjectIdAndFileIdParams,
    {},
    ShapeValidation.CreateShapeBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new Error('User not found')
    }

    const { orgid: orgId, projectid: projectId, fileid: fileId } = req.params
    const { classId, ...restBody } = req.body

    const id = req.body.id || getObjectId().toString()
    const shapeDoc = await ShapeService.dbCreateShape(
      orgId,
      projectId,
      fileId,
      req.user.id,
      {
        ...restBody,
        id: id,
        _id: getObjectId(id),
        orgId: getObjectId(orgId),
        projectId: getObjectId(projectId),
        fileId: getObjectId(fileId),
        stroke: req.body.stroke || 'red',
        strokeWidth: req.body.strokeWidth || 2,
        classId: classId ? getObjectId(classId) : undefined,
      }
    )
    return res.status(httpStatus.CREATED).json(shapeDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const updateShapeController = async (
  req: Request<
    ShapeValidation.HasShapeIdParams,
    {},
    ShapeValidation.UpdateShapeBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new Error('User not found')
    }

    const {
      shapeid: shapeId,
      orgid: orgId,
      projectid: projectId,
      fileid: fileId,
    } = req.params
    const { classId, ...restBody } = req.body

    const shapeDoc = await ShapeService.dbUpdateShape(
      orgId,
      projectId,
      fileId,
      req.user.id,
      shapeId,
      {
        ...restBody,
        classId: classId ? getObjectId(classId) : undefined,
      }
    )
    if (!shapeDoc) {
      throw new Error('Shape not found')
    }

    return res.status(httpStatus.OK).json(shapeDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const deleteShapeController = async (
  req: Request<ShapeValidation.HasShapeIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shapeid: shapeId } = req.params
    const shapeDoc = await ShapeService.dbDeleteShape(shapeId)
    if (!shapeDoc) {
      throw new Error('Shape not found')
    }

    return res.status(httpStatus.OK).json(shapeDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const getShapes = async (
  req: Request<ShapeValidation.HasOrgIdProjectIdAndFileIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileid: fileId, orgid: orgId, projectid: projectId } = req.params
    const shapeDocs = await ShapeService.dbGetShapes(orgId, projectId, fileId)
    const shapesJson = shapeDocs.map((shape) => shape.toJSON())
    return res.status(httpStatus.OK).json(shapesJson)
  } catch (err) {
    next(err)
  }
}
