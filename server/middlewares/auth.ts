import passport from 'passport'
import { Handler } from 'express'
import httpStatus from 'http-status'

import * as ProjectService from '../modules/projects/project.service'
import APIError from '../errors/api-error'

export const authorize = passport.authenticate('jwt', { session: false })

export const onlyDataManagers: Handler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    const userId = req.user.id.toString()
    const projectId = req.params.projectid
    if (!projectId) {
      throw new APIError('ProjectId not found', httpStatus.NOT_FOUND)
    }

    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      throw new APIError(
        `Project with ID ${projectId} not found`,
        httpStatus.NOT_FOUND
      )
    }

    const dataManagerIds = projectDoc.dataManagers.map((dm) => dm.toString())
    if (!dataManagerIds.includes(userId)) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    next()
  } catch (error) {
    next(error)
  }
}

export const onlyDataManagersAndReviewers: Handler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    const userId = req.user.id.toString()
    const projectId = req.params.projectid
    if (!projectId) {
      throw new APIError('ProjectId not found', httpStatus.NOT_FOUND)
    }

    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      throw new APIError(
        `Project with ID ${projectId} not found`,
        httpStatus.NOT_FOUND
      )
    }

    const dataManagerIds = projectDoc.dataManagers.map((dm) => dm.toString())
    const reviewerIds = projectDoc.reviewers.map((r) => r.toString())
    const allowedUsers = [...dataManagerIds, ...reviewerIds]
    if (!allowedUsers.includes(userId)) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    next()
  } catch (error) {
    next(error)
  }
}
