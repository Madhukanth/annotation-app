import { Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status'
import moment from 'moment'
import { formidable } from 'formidable'
import fse from 'fs-extra'
import path from 'path'

import * as ActionService from '../action/action.service'
import * as ProjectService from './project.service'
import * as ProjectValidation from './project.validation'
import * as UserService from '../users/user.service'
import APIError from '../../errors/api-error'
import { getObjectId } from '../../utils/db'
import envs from '../../config/vars'
import { createGetPresignedURL, createPutPresignedUrl } from '../../utils/aws'
import { getBlobUrl, listBlobsAndCreateFiles } from '../../utils/azure'
import ActionModel from '../action/action.model'
import * as FileService from '../files/file.service'
import AnnotationClassModel from '../annotationclasses/annotationclasses.model'
import FileModel from '../files/file.model'

export const createProjectController = async (
  req: Request<
    ProjectValidation.HasOrgIdParams,
    {},
    ProjectValidation.CreateProjectBody
  >,
  res: Response,
  next: NextFunction
) => {
  let projectId: string | null = null

  try {
    if (!req.user) {
      throw new APIError('Not authenticated', httpStatus.UNAUTHORIZED)
    }

    const { name, storage, taskType, ...otherOptionals } = req.body
    const { orgid: orgId } = req.params
    const projectDoc = await ProjectService.dbCreateProject(
      name,
      orgId,
      req.user.id,
      storage,
      taskType,
      otherOptionals
    )
    const projectJson = projectDoc.toJSON()
    projectId = projectJson.id

    if (
      storage === 'azure' &&
      otherOptionals.azureStorageAccount &&
      otherOptionals.azurePassKey &&
      otherOptionals.azureContainerName
    ) {
      let reqContainerName = otherOptionals.azureContainerName
      if (reqContainerName.startsWith('/')) {
        reqContainerName = reqContainerName.slice(1)
      }
      if (reqContainerName.endsWith('/')) {
        reqContainerName = reqContainerName.slice(0, -1)
      }

      const split = reqContainerName.split('/')
      const containerName = split.shift()!
      let prefix: string | undefined = split.join('/')
      if (prefix.length > 0) {
        prefix = `${prefix}/`
      } else {
        prefix = undefined
      }

      // Update the project with the container name and prefix
      await ProjectService.dbUpdateProject(projectId, {
        azureContainerName: containerName,
        ...(prefix && { prefix }),
      })

      listBlobsAndCreateFiles(
        otherOptionals.azureStorageAccount,
        otherOptionals.azurePassKey,
        containerName,
        projectJson,
        undefined,
        prefix
      )
    }

    return res
      .status(httpStatus.CREATED)
      .json({ id: projectJson.id, name: projectJson.name })
  } catch (err) {
    if (projectId) {
      await ProjectService.dbDeleteProject(projectId)
    }
    next(err)
  }
}

export const listProjectsController = async (
  req: Request<
    ProjectValidation.HasOrgIdParams,
    {},
    {},
    ProjectValidation.ListProjectsQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId } = req.params
    const { userid: userId, skip, limit } = req.query

    const skipNum = Number(skip)
    const limitNum = Number(limit)

    const projectList = await ProjectService.dbListProjectsBy(
      orgId,
      userId,
      isNaN(skipNum) ? 0 : skipNum,
      isNaN(limitNum) ? 20 : limitNum
    )
    const count = await ProjectService.dbGetProjectsCount(orgId, userId)
    return res
      .status(httpStatus.OK)
      .json({ projects: projectList, count: count })
  } catch (err) {
    next(err)
  }
}

export const deleteProjectController = async (
  req: Request<ProjectValidation.DeleteProjectParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    await ProjectService.dbDeleteProject(projectId)
    return res.status(httpStatus.OK).json(projectId)
  } catch (err) {
    next(err)
  }
}

export const removeUserFromProjectController = async (
  req: Request<ProjectValidation.RemoveUserFromProjectParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId, userid: userId } = req.params
    const updatedProject = await ProjectService.dbRemoveUserFromProject(
      projectId,
      userId
    )
    if (!updatedProject) {
      throw new APIError('Project not found', httpStatus.NOT_FOUND)
    }

    return res.status(httpStatus.OK).json(userId)
  } catch (err) {
    next(err)
  }
}

export const getProjectUsersController = async (
  req: Request<ProjectValidation.GetProjectUsersParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const projectDoc = await ProjectService.dbGetProjectUsers(projectId)
    if (!projectDoc) {
      throw new APIError('Project not found', httpStatus.NOT_FOUND)
    }

    const projectJson = projectDoc.toJSON()
    return res.status(httpStatus.OK).json({
      dataManagers: projectJson.dataManagers,
      annotators: projectJson.annotators,
      reviewers: projectJson.reviewers,
    })
  } catch (err) {
    next(err)
  }
}

export const getProjectFilesController = async (
  req: Request<
    ProjectValidation.GetProjectFilesParams,
    {},
    {},
    ProjectValidation.GetProjectFilesQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId } = req.params
    const {
      skip,
      limit,
      tags,
      hasShapes,
      annotator,
      completedAfter,
      skippedAfter,
      skipped,
      complete,
      skipFileIds,
      assign,
    } = req.query

    const skipNum = Number(skip)
    const limitNum = Number(limit)
    const files = await ProjectService.dbGetProjectFiles(
      orgId,
      projectId,
      isNaN(skipNum) ? 0 : skipNum,
      isNaN(limitNum) ? 20 : limitNum,
      !hasShapes ? undefined : hasShapes === 'true',
      annotator,
      completedAfter,
      skippedAfter,
      !skipped ? undefined : skipped === 'true',
      !complete ? undefined : complete === 'true',
      skipFileIds ? skipFileIds.split(',') : undefined,
      !assign ? undefined : assign === 'true',
      tags ? tags.split(',') : undefined
    )
    const count = await ProjectService.dbGetProjectFilesCount(
      projectId,
      !hasShapes ? undefined : hasShapes === 'true',
      annotator,
      completedAfter,
      skippedAfter,
      !skipped ? undefined : skipped === 'true',
      !complete ? undefined : complete === 'true',
      tags ? tags.split(',') : undefined
    )

    return res.status(httpStatus.OK).json({ files, count })
  } catch (err) {
    next(err)
  }
}

export const getProjectBasicInfoController = async (
  req: Request<ProjectValidation.GetProjectBasicInfoParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const info = await ProjectService.getProjectBasicInfo(projectId)
    return res.status(httpStatus.OK).json({ ...info })
  } catch (err) {
    next(err)
  }
}

export const getUserStats = async (
  req: Request<
    ProjectValidation.GetUserStatsParams,
    {},
    {},
    ProjectValidation.GetUserStatsQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId, userid: userId } = req.params
    const { lastdays } = req.query

    let minusDays = 7
    if (lastdays) {
      const lastdaysNum = Number(lastdays)
      if (!isNaN(lastdaysNum)) {
        minusDays = lastdaysNum
      }
    }

    const start = moment()
      .utc()
      .set({
        hour: 0,
        minutes: 0,
        second: 0,
        millisecond: 0,
      })
      .subtract({ days: minusDays - 1 })
      .toDate()
    const end = moment()
      .utc()
      .set({
        hour: 11,
        minutes: 59,
        second: 0,
        millisecond: 0,
      })
      .add({ days: 1 })

    const binIntervals = []
    const diffInDays = end.diff(start, 'days')
    for (let i = 0; i < diffInDays; i++) {
      const bStart = moment(start)
        .add(i * 1, 'days')
        .toDate()
      const bEnd = moment(bStart).add(1, 'days').toDate()
      binIntervals.push({ bStart, bEnd })
    }

    const binWiseUniqueFileId: { [binKey: string]: boolean } = {}
    const result: {
      [key: string]: {
        start: Date
        end: Date
        skipped: number
        completed: number
      }
    } = {}
    for (const bin of binIntervals) {
      const key = `${bin.bStart}to${bin.bEnd}`
      result[key] = {
        start: bin.bStart,
        end: bin.bEnd,
        completed: 0,
        skipped: 0,
      }
    }

    const fileDocs = await FileModel.find({
      projectId: getObjectId(projectId),
      annotator: getObjectId(userId),
      $or: [
        {
          completedAt: {
            $gte: new Date(start.toString()),
            $lt: new Date(end.toString()),
          },
        },
        {
          skippedAt: {
            $gte: new Date(start.toString()),
            $lt: new Date(end.toString()),
          },
        },
      ],
    })

    let binIdx = 0
    let docIdx = 0
    while (docIdx < fileDocs.length) {
      const bin = binIntervals[binIdx]
      const doc = fileDocs[docIdx].toJSON()
      const fileId = doc._id.toString()
      const binKey = `${bin.bStart}to${bin.bEnd}`

      const actionDate = (doc.completedAt || doc.skippedAt)!
      if (new Date(actionDate).valueOf() <= new Date(bin.bEnd).valueOf()) {
        const binUniqueFileAndNameKey = `${binKey}-${fileId}-${doc.name}`
        if (!binWiseUniqueFileId[binUniqueFileAndNameKey]) {
          binWiseUniqueFileId[binUniqueFileAndNameKey] = true
          if (doc.complete) {
            result[binKey].completed += 1
          }

          if (doc.skipped) {
            result[binKey].skipped += 1
          }
        }

        docIdx++
      } else {
        binIdx++
      }
    }

    return res.status(httpStatus.OK).json(Object.values(result))
  } catch (err) {
    next(err)
  }
}

export const getUserCompletedStats = async (
  req: Request<
    ProjectValidation.GetUserStatsParams,
    {},
    {},
    ProjectValidation.GetUserStatsQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId, userid: userId } = req.params

    // Get all files completed, skipped and remaining for the user
    const files = await FileService.dbGetFilesByProjectIdAndUserId(
      projectId,
      userId
    )
    const completedFiles = files.filter((file) => file.complete)
    const skippedFiles = files.filter((file) => file.skipped)

    return res.status(httpStatus.OK).json({
      total: files.length,
      completed: completedFiles.length,
      skipped: skippedFiles.length,
      remaining: files.length - (completedFiles.length + skippedFiles.length),
    })
  } catch (err) {
    next(err)
  }
}

export const updateProjectController = async (
  req: Request<
    ProjectValidation.UpdateProjectParams,
    {},
    ProjectValidation.UpdateProjectBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params

    const updatedDoc = await ProjectService.dbUpdateProject(projectId, {
      ...req.body,
      ...(req.body.defaultClassId && {
        defaultClassId: getObjectId(req.body.defaultClassId),
      }),
    })
    if (!updatedDoc) {
      throw new Error('Project not found')
    }

    return res.status(httpStatus.OK).json(updatedDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const getProjectController = async (
  req: Request<ProjectValidation.HasProjectIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      throw new Error('Project not found')
    }

    return res.status(httpStatus.OK).json(projectDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const createFileUploadUrl = async (
  req: Request<ProjectValidation.HasProjectIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId } = req.params
    const { originalName, type } = req.body

    const project = await ProjectService.dbGetProjectById(projectId)
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`)
    }

    const fileId = getObjectId().toString()
    const ext = path.extname(originalName)
    const fileName = `${fileId}${ext}`

    const basePath = `/orgs/${orgId}/projects/${projectId}/instructions`
    const relativePath = `${basePath}/${fileName}`
    let uploadUrl = `${basePath}/${fileId}/upload`
    if (project.storage === 'aws') {
      uploadUrl = await createPutPresignedUrl(
        project.awsRegion,
        project.awsApiVersion,
        project.awsAccessKeyId,
        project.awsSecretAccessKey,
        project.awsBucketName,
        `${project.id}/instructions/${fileName}`,
        type
      )
    } else if (project.storage === 'azure') {
      uploadUrl = await getBlobUrl(
        project.azureStorageAccount,
        project.azurePassKey,
        project.id,
        `instructions/${fileName}`,
        1000
      )
    }

    let getUrl = relativePath
    if (project.storage === 'aws') {
      getUrl = await createGetPresignedURL(
        project.awsRegion,
        project.awsApiVersion,
        project.awsAccessKeyId,
        project.awsSecretAccessKey,
        project.awsBucketName,
        `${project.id}/instructions/${fileName}`
      )
    } else if (project.storage === 'azure') {
      getUrl = await getBlobUrl(
        project.azureStorageAccount,
        project.azurePassKey,
        project.id,
        `instructions/${fileName}`,
        1000
      )
    }

    return res
      .status(httpStatus.CREATED)
      .json({ uploadUrl, relativePath, name: fileName, fileId, getUrl })
  } catch (err) {
    next(err)
  }
}

export const uploadProjectInstructionFileController = async (
  req: Request<ProjectValidation.UploadProjectInstructionFileParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId, fileid: fileId } = req.params

    let originalName = `${fileId}.jpg`
    let modifiedName = originalName

    const projectFolder = path.join(
      'orgs',
      orgId,
      'projects',
      projectId,
      'instructions'
    )

    let fileRelativePath = path.join(projectFolder, originalName)
    const uploadTo = path.join(envs.DATA_ROOT!, projectFolder)
    await fse.ensureDir(uploadTo)

    const upload = formidable({
      uploadDir: uploadTo,
      filename: (name, ext, { originalFilename }) => {
        if (!originalFilename) return originalName

        originalName = originalFilename
        const fileext = path.extname(originalFilename)
        modifiedName = `${fileId}${fileext}`
        fileRelativePath = path.join(projectFolder, modifiedName)
        return modifiedName
      },
    })

    upload.parse(req)

    upload.once('error', async (error) => {
      await fse.remove(path.join(uploadTo, modifiedName))
      next(error)
    })

    upload.once('end', async () => {
      return res.status(httpStatus.CREATED).json(fileRelativePath)
    })
  } catch (err) {
    next(err)
  }
}

export const syncProjectController = async (
  req: Request<ProjectValidation.HasProjectIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      throw new Error(`Project with id ${projectId} not found`)
    }

    const projectJson = projectDoc.toJSON()
    if (
      projectJson.storage === 'azure' &&
      projectJson.azureStorageAccount &&
      projectJson.azurePassKey &&
      projectJson.azureContainerName
    ) {
      listBlobsAndCreateFiles(
        projectJson.azureStorageAccount,
        projectJson.azurePassKey,
        projectJson.azureContainerName.split('/')[0],
        projectJson,
        projectJson.syncedAt,
        projectJson.prefix
      )
    }

    return res.status(httpStatus.OK).json(projectId)
  } catch (err) {
    next(err)
  }
}

export const getAnnotatorStatsController = async (
  req: Request<ProjectValidation.HasProjectIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const annotatorsStats = await ProjectService.dbGetAnnotatorsStats(
      req.params.projectid
    )
    if (!annotatorsStats) {
      throw new Error('Project not found')
    }

    return res.status(httpStatus.OK).json(annotatorsStats)
  } catch (err) {
    next(err)
  }
}

export const addAutoAnnotationsController = async (
  req: Request<ProjectValidation.HasProjectIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId, orgid: orgId } = req.params
    const prompts = req.body

    await ProjectService.dbAddAutoAnnotations(orgId, projectId, prompts)
    return res.status(httpStatus.CREATED).json('done')
  } catch (err) {
    next(err)
  }
}

export const exportProjectController = async (
  req: Request<ProjectValidation.HasProjectIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectid
    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      throw new Error('Project not found')
    }

    let exportJson: any = {}
    if (projectDoc.taskType === 'classification') {
      exportJson = await ProjectService.dbExportClassifications(projectId)
    } else if (projectDoc.taskType === 'object-annotation') {
      exportJson = await ProjectService.dbExportAnnotations(projectId)
    }

    const jsonName = `${projectDoc.name}.json`
    const exportJsonPath = path.join(envs.DATA_ROOT!, 'export', jsonName)
    await fse.ensureDir(path.dirname(exportJsonPath))
    await fse.writeJSON(exportJsonPath, exportJson)

    res.setHeader('Content-Disposition', `attachment; filename="${jsonName}"`)
    return res.sendFile(exportJsonPath, () => {
      fse.remove(exportJsonPath)
    })
  } catch (err) {
    next(err)
  }
}

export const exportProjectStatsController = async (
  req: Request<ProjectValidation.HasProjectIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectid
    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      throw new Error('Project not found')
    }
    const imagesStats = await ProjectService.dbExportImageStats(projectId)
    if (!imagesStats) {
      throw new Error('Project not found')
    }

    const csvName = `${projectDoc.name}-stats.csv`
    const exportStatsJsonPath = path.join(envs.DATA_ROOT!, 'export', csvName)
    await fse.ensureDir(path.dirname(exportStatsJsonPath))
    await fse.writeFile(exportStatsJsonPath, imagesStats)

    res.setHeader('Content-Disposition', `attachment; filename="${csvName}"`)
    return res.sendFile(exportStatsJsonPath, () => {
      fse.remove(exportStatsJsonPath)
    })
  } catch (err) {
    next(err)
  }
}

export const addMembersController = async (
  req: Request<
    ProjectValidation.HasProjectIdParams,
    {},
    ProjectValidation.AddMembersBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const membersToAdd = req.body
    for (const member of membersToAdd) {
      if (!member.email && !member.userId) {
        continue
      }

      let userId = member.userId
      if (!userId) {
        const user = await UserService.dbFindUserByEmail(member.email!)
        if (!user) {
          throw new APIError(
            `User with email ${member.email} not found`,
            httpStatus.NOT_FOUND
          )
        }
        userId = user._id.toString()
      }

      if (member.role === 'datamanager') {
        await ProjectService.dbAddDataManagerToProject(projectId, userId)
      } else if (member.role === 'annotator') {
        await ProjectService.dbAddAnnotatorToProject(projectId, userId)
      } else if (member.role === 'reviewer') {
        await ProjectService.dbAddReviewerToProject(projectId, userId)
      }
    }

    return res.status(httpStatus.OK).json(projectId)
  } catch (err) {
    next(err)
  }
}

export const revertImagesFromUserController = async (
  req: Request<
    ProjectValidation.HasProjectIdParams,
    {},
    ProjectValidation.RevertImagesFromUserBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const { userId } = req.body

    await ProjectService.dbRevertImagesFromUser(projectId, userId)

    return res.status(httpStatus.OK).json(projectId)
  } catch (err) {
    next(err)
  }
}

export const getCompletedRangeStatsController = async (
  req: Request<
    ProjectValidation.HasProjectIdParams,
    {},
    {},
    ProjectValidation.GetUserStatsQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const { lastdays } = req.query

    let minusDays = 7
    if (lastdays) {
      const lastdaysNum = Number(lastdays)
      if (!isNaN(lastdaysNum)) {
        minusDays = lastdaysNum
      }
    }

    const start = moment()
      .utc()
      .set({
        hour: 0,
        minutes: 0,
        second: 0,
        millisecond: 0,
      })
      .subtract({ days: minusDays - 1 })
      .toDate()
    const end = moment()
      .utc()
      .set({
        hour: 11,
        minutes: 59,
        second: 0,
        millisecond: 0,
      })
      .add({ days: 1 })

    const result = await ProjectService.dbGetCompletedRangeStats(
      projectId,
      start,
      end.toDate()
    )
    return res.status(httpStatus.OK).json(result)
  } catch (err) {
    next(err)
  }
}

export const getTopAnnotatorsController = async (
  req: Request<
    ProjectValidation.HasProjectIdParams,
    {},
    {},
    ProjectValidation.GetUserStatsQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const { lastdays } = req.query

    let minusDays = 7
    if (lastdays) {
      const lastdaysNum = Number(lastdays)
      if (!isNaN(lastdaysNum)) {
        minusDays = lastdaysNum
      }
    }

    const start = moment()
      .utc()
      .set({
        hour: 0,
        minutes: 0,
        second: 0,
        millisecond: 0,
      })
      .subtract({ days: minusDays - 1 })
      .toDate()
    const end = moment()
      .utc()
      .set({
        hour: 11,
        minutes: 59,
        second: 0,
        millisecond: 0,
      })
      .add({ days: 1 })

    const result = await ProjectService.dbGetTopAnnotators(
      projectId,
      start,
      end.toDate()
    )
    return res.status(httpStatus.OK).json(result)
  } catch (err) {
    throw err
  }
}
