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
        org_id: orgId,
        project_id: projectId,
        file_id: fileId,
        stroke: req.body.stroke || 'red',
        stroke_width: req.body.strokeWidth || 2,
        class_id: classId,
      }
    )
    return res.status(httpStatus.CREATED).json(shapeDoc)
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
        class_id: classId,
      }
    )
    if (!shapeDoc) {
      throw new Error('Shape not found')
    }

    return res.status(httpStatus.OK).json(shapeDoc)
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

    return res.status(httpStatus.OK).json(shapeDoc)
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
    return res.status(httpStatus.OK).json(shapeDocs)
  } catch (err) {
    next(err)
  }
}
