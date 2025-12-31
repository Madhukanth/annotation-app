import { NextFunction, Request, Response } from 'express'
import { formidable } from 'formidable'
import fse from 'fs-extra'
import httpStatus from 'http-status'
import path from 'path'

import * as AnnotationClassService from '../annotationclasses/annotationclasses.service'
import * as ProjectService from '../projects/project.service'
import * as FileService from './file.service'
import * as FileValidation from './file.validation'
import envs from '../../config/vars'
import { getObjectId } from '../../utils/db'
import APIError from '../../errors/api-error'
import { createGetPresignedURL, createPutPresignedUrl } from '../../utils/aws'
import * as AzureService from '../../utils/azure'
import * as VideoIO from '../../utils/videoio'
import * as AwsService from '../../utils/aws'
import logger from '../../config/logger'

export const createFileUrlController = async (
  req: Request<
    FileValidation.HasOrgIdAndProjectIdParams,
    {},
    FileValidation.CreateUploadUrlBody
  >,
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

    const fileWithNameAlreadyExist = await FileService.dbGetFileByOriginalName(
      originalName
    )
    let updatedOriginalName = originalName
    const ext = path.extname(updatedOriginalName)
    if (fileWithNameAlreadyExist) {
      const onlyName = path.parse(originalName).name
      updatedOriginalName = `${onlyName}-${new Date().getMilliseconds()}${ext}`
    }

    const fileId = getObjectId().toString()
    const fileName = `${fileId}${ext}`

    const basePath = `/orgs/${orgId}/projects/${projectId}/files`
    const relativePath = `${basePath}/${fileName}`
    let uploadUrl = `${basePath}/${fileId}/upload`
    if (project.storage === 'aws') {
      uploadUrl = await createPutPresignedUrl(
        project.awsRegion,
        project.awsApiVersion,
        project.awsAccessKeyId,
        project.awsSecretAccessKey,
        project.awsBucketName,
        `${project.id}/${updatedOriginalName}`,
        type
      )
    } else if (project.storage === 'azure') {
      uploadUrl = await AzureService.getBlobUrl(
        project.azureStorageAccount,
        project.azurePassKey,
        project.azureContainerName.split('/')[0],
        updatedOriginalName,
        1000
      )
    }

    return res.status(httpStatus.CREATED).json({
      uploadUrl,
      relativePath,
      name: fileName,
      fileId,
      updatedOriginalName,
    })
  } catch (err) {
    next(err)
  }
}

export const completeUploadController = async (
  req: Request<
    FileValidation.HasOrgIdProjectIdAndFileIdParams,
    {},
    FileValidation.CompleteUploadBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId, fileid: fileId } = req.params
    const { originalName, relativePath, ...restBody } = req.body

    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Project not found' })
    }

    const projectJson = projectDoc.toJSON()

    let newUrl = relativePath
    if (projectJson.storage === 'aws') {
      newUrl = await createGetPresignedURL(
        projectJson.awsRegion,
        projectJson.awsApiVersion,
        projectJson.awsAccessKeyId,
        projectJson.awsSecretAccessKey,
        projectJson.awsBucketName,
        `${projectJson.id}/${originalName}`
      )
    } else if (projectJson.storage === 'azure') {
      newUrl = await AzureService.getBlobUrl(
        projectJson.azureStorageAccount,
        projectJson.azurePassKey,
        projectJson.azureContainerName.split('/')[0],
        originalName,
        1000
      )
    }

    const fileDoc = await FileService.dbCreateFile({
      ...restBody,
      _id: getObjectId(fileId),
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      name: originalName,
      originalName,
      relativePath,
      url: newUrl,
      annotator: null,
      assignedAt: null,
      storedIn: projectJson.storage,
      complete: false,
      tags: [],
      hasShapes: false,
      annotatedAt: null,
      skipped: false,
    })

    return res.status(httpStatus.CREATED).json(fileDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const uploadFileController = async (
  req: Request<FileValidation.HasOrgIdProjectIdAndFileIdParams>,
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
      'files'
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
      return res.status(httpStatus.OK).json(fileRelativePath)
    })
  } catch (err) {
    next(err)
  }
}

export const updateFileController = async (
  req: Request<FileValidation.HasOrgIdProjectIdAndFileIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new Error('User not found')
    }

    const { fileid: fileId, orgid: orgId, projectid: projectId } = req.params
    const updatedDoc = await FileService.dbUpdateFileCollection(
      orgId,
      projectId,
      fileId,
      req.user.id,
      { ...req.body }
    )
    if (!updatedDoc) {
      throw new APIError('File not found', httpStatus.NOT_FOUND)
    }

    return res.status(httpStatus.OK).json(updatedDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const deleteFileController = async (
  req: Request<FileValidation.HasOrgIdProjectIdAndFileIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileid: fileId } = req.params
    const deletedFile = await FileService.dbDeleteFile(fileId)
    if (!deletedFile) {
      throw new APIError('File not found')
    }

    return res.status(httpStatus.OK).json(deletedFile.toJSON())
  } catch (err) {
    next(err)
  }
}

export const associateTagIdsToFileController = async (
  req: Request<
    FileValidation.HasOrgIdAndProjectIdParams,
    {},
    FileValidation.AssociateTagIdsToFileBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId } = req.params
    const body = req.body

    for (const fileName in body) {
      const tagNames = body[fileName]
      const classes = await AnnotationClassService.dbGetAnnotationClassByNames(
        orgId,
        projectId,
        tagNames
      )

      const classIdList = classes.map((c) => c.toJSON().id)
      await FileService.dbUpdateFileTagsByName(
        orgId,
        projectId,
        fileName,
        classIdList
      )
    }

    return res.status(httpStatus.OK).json('done')
  } catch (err) {
    next(err)
  }
}

export const associateTagsToFilesController = async (
  req: Request<
    FileValidation.HasOrgIdAndProjectIdParams,
    {},
    FileValidation.AssociateTagIdsToFilesBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId } = req.params
    for (const fileId of req.body.fileIds) {
      await FileService.dbUpdateFileTags(
        orgId,
        projectId,
        fileId,
        req.body.tagIds
      )
    }
    return res.status(httpStatus.OK).json('done')
  } catch (err) {
    next(err)
  }
}

export const uploadVideoFileController = async (
  req: Request<FileValidation.HasOrgIdProjectIdAndFileIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId, fileid: fileId } = req.params
    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: 'Project not found' })
    }

    let originalName = `${fileId}.jpg`
    let modifiedName = originalName
    let tmpName = originalName

    const projectFolder = path.join(
      'orgs',
      orgId,
      'projects',
      projectId,
      'files'
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
        modifiedName = `${fileId}.webm`
        tmpName = `${fileId}_tmp${fileext}`
        fileRelativePath = path.join(projectFolder, modifiedName)
        return tmpName
      },
    })

    upload.parse(req)

    upload.once('error', async (error) => {
      await fse.remove(path.join(uploadTo, modifiedName))
      next(error)
    })

    upload.once('end', async () => {
      const tmpPath = path.join(uploadTo, tmpName)
      const outVideo = path.join(uploadTo, modifiedName)
      const progressFile = path.join(uploadTo, `${fileId}_progress.json`)

      try {
        const tmpVideoMetadata = await VideoIO.getVideoInfo(tmpPath)
        await VideoIO.generateH264Video(
          tmpPath,
          outVideo,
          tmpVideoMetadata.hasaudio,
          progressFile
        )
        await fse.remove(tmpPath)
        await fse.remove(progressFile)
        const videoMetadata = await VideoIO.getVideoInfo(outVideo)

        const fileWithNameAlreadyExist =
          await FileService.dbGetFileByOriginalName(originalName)
        let updatedOriginalName = originalName
        const ext = path.extname(updatedOriginalName)
        if (fileWithNameAlreadyExist) {
          const onlyName = path.parse(originalName).name
          updatedOriginalName = `${onlyName}-${new Date().getMilliseconds()}${ext}`
        }

        let newUrl = fileRelativePath
        const projectJson = projectDoc.toJSON()
        if (projectJson.storage === 'aws') {
          await AwsService.uploadLocalFile(
            projectJson.awsRegion,
            projectJson.awsApiVersion,
            projectJson.awsAccessKeyId,
            projectJson.awsSecretAccessKey,
            projectJson.awsBucketName,
            `${projectJson.id}/${updatedOriginalName}`,
            'video/webm',
            outVideo
          )
          newUrl = await createGetPresignedURL(
            projectJson.awsRegion,
            projectJson.awsApiVersion,
            projectJson.awsAccessKeyId,
            projectJson.awsSecretAccessKey,
            projectJson.awsBucketName,
            `${projectJson.id}/${updatedOriginalName}`
          )
          await fse.remove(outVideo)
        } else if (projectJson.storage === 'azure') {
          await AzureService.uploadLocalFile(
            projectJson.azureStorageAccount,
            projectJson.azurePassKey,
            projectJson.azureContainerName.split('/')[0],
            updatedOriginalName,
            outVideo
          )
          newUrl = await AzureService.getBlobUrl(
            projectJson.azureStorageAccount,
            projectJson.azurePassKey,
            projectJson.azureContainerName.split('/')[0],
            updatedOriginalName,
            1000
          )
          await fse.remove(outVideo)
        }

        const fileDoc = await FileService.dbUpdateFileById(fileId, {
          orgId: getObjectId(orgId),
          projectId: getObjectId(projectId),
          name: updatedOriginalName,
          originalName,
          relativePath: fileRelativePath,
          url: newUrl,
          storedIn: projectJson.storage,
          complete: false,
          tags: [],
          type: 'video',
          totalFrames: videoMetadata.framescount,
          fps: videoMetadata.fps,
          duration: videoMetadata.duration,
        })

        if (!fileDoc) {
          throw new Error('File not found')
        }

        return res.status(httpStatus.OK).json(fileDoc.toJSON())
      } catch (err) {
        logger.error(err)
        await fse.remove(tmpPath)
        await fse.remove(progressFile)
        await fse.remove(outVideo)
        await FileService.dbDeleteFile(fileId)
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Error uploading video file' })
      }
    })
  } catch (err1) {
    next(err1)
  }
}

export const exportShapesController = async (
  req: Request<
    FileValidation.HasOrgIdAndProjectIdParams,
    {},
    {},
    FileValidation.ExportShapesQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await FileService.dbExportShapes(
      req.params.orgid,
      req.params.projectid,
      req.query.skip,
      req.query.limit,
      req.query.annotatedAfter
    )

    return res.status(httpStatus.OK).json(result)
  } catch (err) {
    next(err)
  }
}

export const addAzureFilesController = async (
  req: Request<
    FileValidation.HasOrgIdAndProjectIdParams,
    {},
    FileValidation.AddAzureFilesBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const { blobNames } = req.body

    const projectDoc = await ProjectService.dbGetProjectById(projectId)
    if (!projectDoc) {
      throw new Error(`Project with id ${projectId} not found`)
    }

    const projectJson = projectDoc.toJSON()
    const fileIds = await AzureService.addAzureFilesToDb(
      projectJson.azureStorageAccount,
      projectJson.azurePassKey,
      projectJson.azureContainerName.split('/')[0],
      projectJson,
      blobNames
    )

    return res.status(httpStatus.CREATED).json(fileIds)
  } catch (err) {
    next(err)
  }
}
