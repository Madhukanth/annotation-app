import express from 'express'
import {
  processRequestBody,
  processRequestParams,
  processRequestQuery,
} from 'zod-express-middleware'

import {
  authorize,
  onlyDataManagers,
  onlyDataManagersAndReviewers,
} from '../../middlewares/auth'
import * as ProjectValidation from './project.validation'
import * as ProjectController from './project.controller'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Get projects by orgId
  api.get('/', authorize, ProjectController.listProjectsController)

  // Create project
  api.post(
    '/',
    authorize,
    processRequestBody(ProjectValidation.createProjectZod.body),
    ProjectController.createProjectController
  )

  // Get project by id
  api.get(
    '/:projectid',
    authorize,
    processRequestParams(ProjectValidation.hasProjectIdZod.params),
    ProjectController.getProjectController
  )

  // Update project by id
  api.patch(
    '/:projectid',
    authorize,
    onlyDataManagers,
    processRequestParams(ProjectValidation.updateProjectZod.params),
    processRequestBody(ProjectValidation.updateProjectZod.body),
    ProjectController.updateProjectController
  )

  // Delete project by id
  api.delete(
    '/:projectid',
    authorize,
    onlyDataManagers,
    processRequestParams(ProjectValidation.deleteProjectZod.params),
    ProjectController.deleteProjectController
  )

  // Get project range stats
  api.get(
    '/:projectid/range-stats',
    authorize,
    processRequestParams(ProjectValidation.hasProjectIdZod.params),
    processRequestQuery(ProjectValidation.getUserStatsZod.query),
    ProjectController.getCompletedRangeStatsController
  )

  // Get Top annotators for project
  api.get(
    '/:projectid/top-annotators',
    authorize,
    processRequestParams(ProjectValidation.hasProjectIdZod.params),
    processRequestQuery(ProjectValidation.getUserStatsZod.query),
    ProjectController.getTopAnnotatorsController
  )

  // Create project instructions image upload url
  api.post(
    '/:projectid/instructions/upload-url',
    authorize,
    processRequestParams(ProjectValidation.hasProjectIdZod.params),
    ProjectController.createFileUploadUrl
  )

  // Upload project instructions image file
  api.put(
    '/:projectid/instructions/:fileid/upload',
    authorize,
    processRequestParams(
      ProjectValidation.uploadProjectInstructionFileZod.params
    ),
    ProjectController.uploadProjectInstructionFileController
  )

  // Get project users
  api.get(
    '/:projectid/users',
    authorize,
    onlyDataManagers,
    processRequestParams(ProjectValidation.getProjectUsersZod.params),
    ProjectController.getProjectUsersController
  )

  // Remove a user from project
  api.delete(
    '/:projectid/users/:userid',
    authorize,
    onlyDataManagers,
    processRequestParams(ProjectValidation.removeUserFromProjectZod.params),
    ProjectController.removeUserFromProjectController
  )

  // Get user stats
  api.get(
    '/:projectid/users/:userid/stats',
    authorize,
    processRequestParams(ProjectValidation.getUserStatsZod.params),
    processRequestQuery(ProjectValidation.getUserStatsZod.query),
    ProjectController.getUserStats
  )

  // Get user completed stats for project
  api.get(
    '/:projectid/users/:userid/completed-stats',
    authorize,
    processRequestParams(ProjectValidation.getUserStatsZod.params),
    processRequestQuery(ProjectValidation.getUserStatsZod.query),
    ProjectController.getUserCompletedStats
  )

  // Get project files
  api.get(
    '/:projectid/files',
    authorize,
    processRequestParams(ProjectValidation.getProjectFilesZod.params),
    ProjectController.getProjectFilesController
  )

  // Get project basic info
  api.get(
    '/:projectid/info',
    authorize,
    processRequestParams(ProjectValidation.getProjectBasicInfoZod.params),
    ProjectController.getProjectBasicInfoController
  )

  // Sync project with latest files
  api.post(
    '/:projectid/sync',
    authorize,
    onlyDataManagers,
    processRequestParams(ProjectValidation.hasProjectIdZod.params),
    ProjectController.syncProjectController
  )

  // Get annotator stats for project
  api.get(
    '/:projectid/stats',
    authorize,
    ProjectController.getAnnotatorStatsController
  )

  // Add auto annotations
  api.post(
    '/:projectid/auto-annotations',
    authorize,
    onlyDataManagers,
    ProjectController.addAutoAnnotationsController
  )

  // Export project annotations into json file
  api.get('/:projectid/export', ProjectController.exportProjectController)

  // Export each image status in project into csv file
  api.get(
    '/:projectid/export-stats',
    ProjectController.exportProjectStatsController
  )

  // Add members to project
  api.post(
    '/:projectid/add-members',
    authorize,
    onlyDataManagers,
    processRequestBody(ProjectValidation.addMembersZod.body),
    ProjectController.addMembersController
  )

  api.patch(
    '/:projectid/revert',
    authorize,
    processRequestBody(ProjectValidation.revertImagesFromUserZod.body),
    ProjectController.revertImagesFromUserController
  )

  return api
}
