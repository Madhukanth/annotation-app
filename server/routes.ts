import express from 'express'
import { processRequestParams } from 'zod-express-middleware'

import envs from './config/vars'
import userRoutes from './modules/users/user.routes'
import authRoutes from './modules/auth/auth.routes'
import organizationRoutes from './modules/organizations/organization.routes'
import projectRoutes from './modules/projects/project.routes'
import fileRoutes from './modules/files/file.routes'
import invitationRoutes from './modules/invitations/invitation.routes'
import actionRoutes from './modules/action/action.routes'
import commentsRoutes from './modules/comments/comments.routes'
import commentfilesRoutes from './modules/commentfiles/commentfiles.routes'
import annotationclassesRoutes from './modules/annotationclasses/annotationclasses.routes'
import shapesRoutes from './modules/shapes/shapes.routes'
import * as ProjectValidation from './modules/projects/project.validation'
import * as FileValidation from './modules/files/file.validation'
import * as InviteValidation from './modules/invitations/invitation.validation'
import * as ActionValidation from './modules/action/action.validation'
import * as CommentsValidation from './modules/comments/comments.validation'
import * as CommentFilesValidation from './modules/commentfiles/commentfiles.validation'
import * as AnnotationClassValidation from './modules/annotationclasses/annotationclasses.validation'
import * as ShapeValidation from './modules/shapes/shapes.validation'

const routes = express.Router()
routes.get('/', (_req, res) => res.send('OK'))
routes.use('/static', express.static(envs.DATA_ROOT!))
routes.use('/auth', authRoutes())
routes.use('/users', userRoutes())
routes.use('/orgs', organizationRoutes())
routes.use(
  '/orgs/:orgid/projects',
  processRequestParams(ProjectValidation.hasOrgIdZod.params),
  projectRoutes()
)
routes.use(
  '/orgs/:orgid/projects/:projectid/files',
  processRequestParams(FileValidation.hasOrgIdAndProjectIdZod.params),
  fileRoutes()
)
routes.use(
  '/orgs/:orgid/projects/:projectid/invitation',
  processRequestParams(InviteValidation.hasOrgIdAndProjectIdZod.params),
  invitationRoutes()
)
routes.use(
  '/orgs/:orgid/projects/:projectid/files/:fileid/actions',
  processRequestParams(ActionValidation.hasOrgIdProjectIdAndFileIdZod.params),
  actionRoutes()
)
routes.use(
  '/orgs/:orgid/projects/:projectid/files/:fileid/comments',
  processRequestParams(CommentsValidation.hasOrgIdProjectIdAndFileIdZod.params),
  commentsRoutes()
)
routes.use(
  '/orgs/:orgid/projects/:projectid/files/:fileid/comments/:commentid/commentfiles',
  processRequestParams(
    CommentFilesValidation.hasOrgIdProjectIdFileIdAndCommentIdZod.params
  ),
  commentfilesRoutes()
)
routes.use(
  '/orgs/:orgid/projects/:projectid/annotationclasses',
  processRequestParams(
    AnnotationClassValidation.hasOrgIdAndProjectIdZod.params
  ),
  annotationclassesRoutes()
)
routes.use(
  '/orgs/:orgid/projects/:projectid/files/:fileid/shapes',
  processRequestParams(ShapeValidation.hasOrgIdProjectIdAndFileIdZod.params),
  shapesRoutes()
)

export default routes
