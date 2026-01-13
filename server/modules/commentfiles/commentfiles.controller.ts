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
    return res.status(httpStatus.OK).json(commentFileDocs)
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
        project.aws_region ?? '',
        project.aws_api_version ?? '',
        project.aws_access_key_id ?? '',
        project.aws_secret_access_key ?? '',
        project.aws_bucket_name ?? '',
        `${project.id}/files/${fileId}/comments/${commentId}/${fileName}`,
        type
      )
    } else if (project.storage === 'azure') {
      uploadUrl = await getBlobUrl(
        project.azure_storage_account ?? '',
        project.azure_pass_key ?? '',
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

    let newUrl = relativePath
    if (projectDoc.storage === 'aws') {
      newUrl = await createGetPresignedURL(
        projectDoc.aws_region ?? '',
        projectDoc.aws_api_version ?? '',
        projectDoc.aws_access_key_id ?? '',
        projectDoc.aws_secret_access_key ?? '',
        projectDoc.aws_bucket_name ?? '',
        `${projectDoc.id}/files/${fileId}/comments/${commentId}/${name}`
      )
    } else if (projectDoc.storage === 'azure') {
      newUrl = await getBlobUrl(
        projectDoc.azure_storage_account ?? '',
        projectDoc.azure_pass_key ?? '',
        projectDoc.id,
        `files/${fileId}/comments/${commentId}/${name}`,
        1000
      )
    }

    const commentFileDoc = await CommentFilesService.dbCreateCommentFile({
      _id: getObjectId(commentFileId),
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      fileId: getObjectId(fileId),
      commentId: getObjectId(commentId),
      name,
      originalName,
      storedIn: projectDoc.storage,
      url: newUrl,
      relativeUrl: relativePath,
      type: 'image',
    })
    return res.status(httpStatus.CREATED).json(commentFileDoc)
  } catch (err) {
    next(err)
  }
}
