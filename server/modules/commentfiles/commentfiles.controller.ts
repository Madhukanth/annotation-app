import { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'
import path from 'path'
import fse from 'fs-extra'
import { formidable } from 'formidable'

import * as ProjectService from '../projects/project.service'
import * as CommentFilesValidation from './commentfiles.validation'
import * as CommentFilesService from './commentfiles.service'
import { getObjectId } from '../../utils/db'
import envs from '../../config/vars'
import { createGetPresignedURL, createPutPresignedUrl } from '../../utils/aws'
import { getBlobUrl } from '../../utils/azure'

export const getCommentFileController = async (
  req: Request<CommentFilesValidation.HasOrgIdProjectIdFileIdAndCommentIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentid: commentId } = req.params

    const commentFileDocs = await CommentFilesService.dbGetCommentFiles(
      commentId
    )
    const commentFilesJson = commentFileDocs.map((c) => c.toJSON())
    return res.status(httpStatus.OK).json(commentFilesJson)
  } catch (err) {
    next(err)
  }
}

export const createCommentFileUrl = async (
  req: Request<CommentFilesValidation.HasOrgIdProjectIdFileIdAndCommentIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      orgid: orgId,
      projectid: projectId,
      fileid: fileId,
      commentid: commentId,
    } = req.params
    const { originalName, type } = req.body

    const project = await ProjectService.dbGetProjectById(projectId)
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`)
    }

    const commentFileId = getObjectId().toString()
    const ext = path.extname(originalName)
    const fileName = `${commentFileId}${ext}`

    const basePath = `/orgs/${orgId}/projects/${projectId}/files/${fileId}/comments/${commentId}`
    const relativePath = `${basePath}/${fileName}`
    let uploadUrl = `${basePath}/${commentFileId}/upload`
    if (project.storage === 'aws') {
      uploadUrl = await createPutPresignedUrl(
        project.awsRegion,
        project.awsApiVersion,
        project.awsAccessKeyId,
        project.awsSecretAccessKey,
        project.awsBucketName,
        `${project.id}/files/${fileId}/comments/${commentId}/${fileName}`,
        type
      )
    } else if (project.storage === 'azure') {
      uploadUrl = await getBlobUrl(
        project.azureStorageAccount,
        project.azurePassKey,
        project.id,
        `files/${fileId}/comments/${commentId}/${fileName}`,
        1000
      )
    }

    return res.status(httpStatus.CREATED).json({
      uploadUrl,
      relativePath,
      name: fileName,
      commentFileId,
      storage: project.storage,
    })
  } catch (err) {
    next(err)
  }
}

export const uploadCommentFileController = async (
  req: Request<CommentFilesValidation.HasOrgIdProjectIdFileIdCommentIdAndCommentFileIdZod>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      commentfileid: commentFileId,
      commentid: commentId,
      orgid: orgId,
      projectid: projectId,
      fileid: fileId,
    } = req.params

    let originalName = `${commentFileId}.jpg`
    let modifiedName = originalName

    const projectFolder = path.join(
      'orgs',
      orgId,
      'projects',
      projectId,
      'files',
      fileId,
      'comments',
      commentId
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
        modifiedName = `${commentFileId}${fileext}`
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

export const completeUploadController = async (
  req: Request<
    CommentFilesValidation.HasOrgIdProjectIdFileIdCommentIdAndCommentFileIdZod,
    {},
    CommentFilesValidation.CompleteUploadBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      orgid: orgId,
      projectid: projectId,
      fileid: fileId,
      commentid: commentId,
      commentfileid: commentFileId,
    } = req.params
    const { originalName, name, relativePath } = req.body

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
        `${projectJson.id}/files/${fileId}/comments/${commentId}/${name}`
      )
    } else if (projectJson.storage === 'azure') {
      newUrl = await getBlobUrl(
        projectJson.azureStorageAccount,
        projectJson.azurePassKey,
        projectJson.id,
        `files/${fileId}/comments/${commentId}/${name}`,
        1000
      )
    }

    const commentFileDoc = await CommentFilesService.dbCreateCommentFile({
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      fileId: getObjectId(fileId),
      commentId: getObjectId(commentId),
      _id: getObjectId(commentFileId),
      name,
      originalName,
      storedIn: projectJson.storage,
      url: newUrl,
      relativeUrl: relativePath,
      type: 'image',
    })
    return res.status(httpStatus.CREATED).json(commentFileDoc.toJSON())
  } catch (err) {
    next(err)
  }
}
