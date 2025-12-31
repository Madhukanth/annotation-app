import FileModel, { FileType } from './file.model'
import { getObjectId } from '../../utils/db'
import * as ActionService from '../action/action.service'
import * as ProjectService from '../projects/project.service'
import { deleteObject } from '../../utils/aws'
import { deleteBlob } from '../../utils/azure'
import ShapeModel from '../shapes/shapes.model'
import { Storage } from '../projects/project.model'

export const dbCreateFile = async (newFile: Omit<FileType, 'id'>) => {
  const fileDoc = await FileModel.create({ ...newFile })
  return fileDoc
}

export const dbGetFileByOriginalName = async (originalName: string) => {
  const fileDoc = await FileModel.findOne({ originalName })
  return fileDoc
}

export const dbUpdateFileCollection = async (
  orgId: string,
  projectId: string,
  fileId: string,
  userId: string,
  fileData: Partial<FileType>
) => {
  const fileDoc = await FileModel.findOneAndUpdate(
    { _id: getObjectId(fileId) },
    {
      $set: {
        ...fileData,
        ...(fileData.complete && {
          hasShapes: true,
          skipped: false,
          completedAt: new Date(),
        }),
        ...(fileData.skipped && {
          hasShapes: false,
          complete: false,
          skippedAt: new Date(),
        }),
      },
    },
    { new: true }
  )

  const updateObj = new Object({ ...fileData })
  const hasTagsField = updateObj.hasOwnProperty('tags')
  if (hasTagsField) {
    await ActionService.dbCreateAction({
      name: 'classified',
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      fileId: getObjectId(fileId),
      userId: getObjectId(userId),
    })
  }

  if (fileData.complete) {
    await ActionService.dbCreateAction({
      name: 'mark_complete',
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      fileId: getObjectId(fileId),
      userId: getObjectId(userId),
    })
  }

  if (fileData.skipped) {
    await ActionService.dbCreateAction({
      name: 'skipped',
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      fileId: getObjectId(fileId),
      userId: getObjectId(userId),
    })
  }

  return fileDoc
}

export const dbUpdateFileTags = async (
  orgId: string,
  projectId: string,
  fileId: string,
  tags: string[]
) => {
  const isComplete = tags.length > 0

  const updatedDoc = await FileModel.findOneAndUpdate(
    {
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      _id: getObjectId(fileId),
    },
    {
      tags: tags.map((tagId) => getObjectId(tagId)),
      ...(isComplete && {
        complete: true,
        completedAt: new Date(),
        skipped: false,
      }),
      ...(!isComplete && {
        complete: false,
        skipped: true,
        skippedAt: new Date(),
      }),
    }
  )
  return updatedDoc
}

export const dbUpdateFileTagsByName = async (
  orgId: string,
  projectId: string,
  fileName: string,
  tags: string[]
) => {
  const updatedDoc = await FileModel.findOneAndUpdate(
    {
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      name: fileName,
    },
    { tags: tags.map((tagId) => getObjectId(tagId)) }
  )
  return updatedDoc
}

export const dbDeleteFile = async (fileId: string) => {
  const fileDoc = await FileModel.findOne({ _id: getObjectId(fileId) })
  if (!fileDoc) return null

  await fileDoc.deleteOne()
  return fileDoc
}

export const dbCreateMany = async (
  files: Omit<Omit<FileType, '_id'>, 'id'>[]
) => {
  const fileDocs = await FileModel.insertMany(files)
  return fileDocs
}

export const dbUpdateFileById = async (
  fileId: string,
  uData: Partial<FileType>
) => {
  const fileDoc = await FileModel.findOneAndUpdate(
    { _id: getObjectId(fileId) },
    { $set: { ...uData } },
    { new: true }
  )
  return fileDoc
}

export const updateHasShapes = async (fileId: string, hasShapes: boolean) => {
  await FileModel.findOneAndUpdate({ _id: fileId }, { $set: { hasShapes } })
}

export const dbExportShapes = async (
  orgId: string,
  projectId: string,
  skip: number,
  limit: number,
  annotatedAfter?: Date | string
) => {
  const fileDocs = await FileModel.find({
    orgId: getObjectId(orgId),
    projectId: getObjectId(projectId),
    hasShapes: true,
    ...(annotatedAfter && {
      annotatedAt: { $gte: new Date(annotatedAfter) },
    }),
  })
    .skip(skip)
    .limit(limit)

  const result: {
    [fileId: string]: { points: { x: number; y: number }[]; classId: string }[]
  } = {}

  // Storing fileIds in an array
  const fileIds = fileDocs.map((file) => file._id.toString())

  // Fetching shapes for each file
  const shapes = await ShapeModel.find({
    orgId: getObjectId(orgId),
    projectId: getObjectId(projectId),
    fileId: { $in: fileIds },
  })
  for (const shape of shapes) {
    if (!shape.points || shape.points.length === 0) {
      continue
    }

    const fileId = shape.fileId.toString()
    if (!result[fileId]) {
      result[fileId] = []
    }

    const points = shape.points.map((p) => ({ x: p.x, y: p.y }))
    result[fileId].push({
      points: points,
      classId: shape.classId?.toString() || '',
    })
  }

  // Renaming the result keys from fileId to fileName
  for (const file of fileDocs) {
    const fileJson = file.toJSON()
    const fileId = fileJson._id.toString()
    const fileName = fileJson.name

    if (result[fileId]) {
      result[fileName] = result[fileId]
      delete result[fileId]
    }
  }

  return result
}

export const dbCreateFilesFromCloud = async (
  fileData: {
    orgId: string
    projectId: string
    storedIn: Storage
    blobName: string
    url: string
  }[]
) => {
  const rawFiles: Omit<Omit<FileType, 'id'>, '_id'>[] = []
  for (const data of fileData) {
    rawFiles.push({
      name: data.blobName,
      originalName: data.blobName,
      relativePath: '',
      storedIn: data.storedIn,
      url: data.url,
      type: 'image',
      projectId: getObjectId(data.projectId),
      orgId: getObjectId(data.orgId),
      complete: false,
      fps: 1,
      assignedAt: null,
      annotator: null,
      totalFrames: 1,
      duration: 0,
      tags: [],
      hasShapes: false,
      annotatedAt: null,
      skipped: false,
    })
  }

  if (rawFiles.length === 0) {
    return []
  }

  const rawFileDocs = await dbCreateMany(rawFiles)
  return rawFileDocs.map((file) => file.toJSON().id)
}

export const dbGetFilesByProjectIdAndUserId = async (
  projectId: string,
  userId: string // This is the annotatorId
) => {
  const fileDocs = await FileModel.find({
    projectId: getObjectId(projectId),
    annotator: getObjectId(userId),
  })
  return fileDocs
}
