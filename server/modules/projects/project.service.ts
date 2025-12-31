import ProjectModel, { ProjectType, Storage, Task } from './project.model'
import { getObjectId } from '../../utils/db'
import FileModel from '../files/file.model'
import ActionModel, { ActionType } from '../action/action.model'
import ShapeModel, { ShapeType } from '../shapes/shapes.model'
// import { deleteObjectsWithPrefix } from '../../utils/aws'
// import { deleteContainer } from '../../utils/azure'
import * as UserService from '../users/user.service'
import AnnotationClassModel from '../annotationclasses/annotationclasses.model'
import UserModel from '../users/user.model'
import { parse } from 'json2csv'
import { toZonedTime, format } from 'date-fns-tz'

export const dbCreateProject = async (
  name: string,
  orgId: string,
  adminId: string,
  storage: Storage,
  taskType: Task,
  optionValues: {
    azureStorageAccount?: string
    azurePassKey?: string
    awsSecretAccessKey?: string
    awsAccessKeyId?: string
    awsRegion?: string
    awsApiVersion?: string
    awsBucketName?: string
  }
) => {
  const dataManagersSet = new Set<string>()
  dataManagersSet.add(adminId.toString())

  const superAdmins = await UserService.dbGetAllSuperAdmins()
  for (const user of superAdmins) {
    dataManagersSet.add(user._id.toString())
  }

  const dataManagers = Array.from(dataManagersSet)
  const projectDoc = await ProjectModel.create({
    name,
    orgId: getObjectId(orgId),
    dataManagers: dataManagers.map((id) => getObjectId(id)),
    storage,
    taskType,
    ...optionValues,
  })
  return projectDoc
}

export const dbUpdateProject = async (
  projectId: string,
  projectData: Partial<ProjectType>
) => {
  const updatedProjectDoc = await ProjectModel.findOneAndUpdate(
    { _id: getObjectId(projectId) },
    { ...projectData },
    {
      projection: {
        _id: 1,
        name: 1,
        orgId: 1,
        dataManagers: 1,
        reviewers: 1,
        annotators: 1,
        instructions: 1,
        storage: 1,
        taskType: 1,
      },
    }
  )
  return updatedProjectDoc
}

export const dbGetProjectById = async (projectId: string) => {
  const projectDoc = await ProjectModel.findOne({ _id: getObjectId(projectId) })
  return projectDoc
}

export const dbGetProjectFilesCount = async (
  projectId: string,
  hasShapes?: boolean,
  annotator?: string,
  completedAfter?: string,
  skippedAfter?: string,
  skipped?: boolean,
  complete?: boolean,
  tags?: string[]
) => {
  const count = await FileModel.countDocuments({
    projectId: getObjectId(projectId),
    ...(annotator && { annotator: getObjectId(annotator) }),
    ...(completedAfter && { completedAt: { $gt: new Date(completedAfter) } }),
    ...(skippedAfter && { skippedAt: { $gt: new Date(skippedAfter) } }),
    ...(hasShapes !== undefined && { hasShapes }),
    ...(skipped !== undefined && { skipped }),
    ...(complete !== undefined && { complete }),
    ...(tags && { tags: { $in: tags.map((tag) => getObjectId(tag)) } }),
  })
  return count
}

export const dbGetProjectFiles = async (
  orgId: string,
  projectId: string,
  skip: number = 0,
  limit: number = 20,
  hasShapes?: boolean,
  annotator?: string,
  completedAfter?: string,
  skippedAfter?: string,
  skipped?: boolean,
  complete?: boolean,
  skipFileIds?: string[],
  assign?: boolean,
  tags?: string[]
) => {
  const query: { [field: string]: any } = {
    orgId: getObjectId(orgId),
    projectId: getObjectId(projectId),
    ...(annotator && { annotator: getObjectId(annotator) }),
    ...(completedAfter && { completedAt: { $gt: new Date(completedAfter) } }),
    ...(skippedAfter && { skippedAt: { $gt: new Date(skippedAfter) } }),
    ...(hasShapes !== undefined && { hasShapes }),
    ...(skipped !== undefined && { skipped }),
    ...(complete !== undefined && { complete }),
    ...(skipFileIds && {
      _id: { $nin: skipFileIds.map((id) => getObjectId(id)) },
    }),
  }

  if (tags) {
    const tagObjIds = tags.map((tagId) => getObjectId(tagId))
    query['tags'] = { $in: tagObjIds }
  }

  let fileDocs = await FileModel.find(query)
    .sort({ createdAt: 'asc', name: 'asc' })
    .skip(skip)
    .limit(limit)
    .populate({ path: 'tags', select: { name: 1, color: 1 } })
    .allowDiskUse(true)

  if (fileDocs.length === 0 && assign && annotator) {
    fileDocs = await FileModel.find({
      orgId: getObjectId(orgId),
      projectId: getObjectId(projectId),
      complete: false,
      skipped: false,
      annotator: null,
    })
      .sort({ createdAt: 'asc', name: 'asc' })
      .limit(limit)
      .populate({ path: 'tags', select: { name: 1, color: 1 } })
      .allowDiskUse(true)
    if (fileDocs.length > 0) {
      await FileModel.updateMany(
        { _id: { $in: fileDocs.map((f) => f._id) } },
        { $set: { annotator: getObjectId(annotator), assignedAt: new Date() } }
      )
    }
  }

  const filesJson = fileDocs.map((file) => file.toJSON())
  const fileIds = filesJson.map(({ id }) => id)
  const shapeDocs = await ShapeModel.find({ fileId: { $in: fileIds } })
  const shapesJson = shapeDocs.map((s) => s.toJSON())

  const metadataCollection: {
    [fileId: string]: { [shapeType: string]: ShapeType[] }
  } = {}
  const videoMetadataCollection: {
    [fileId: string]: { [shapeType: string]: { [frame: number]: ShapeType[] } }
  } = {}

  for (const file of filesJson) {
    if (file.type === 'image') {
      metadataCollection[file.id] = {
        polygons: [],
        rectangles: [],
        circles: [],
        faces: [],
        lines: [],
      }
    } else {
      videoMetadataCollection[file.id] = {
        polygons: {},
        rectangles: {},
        circles: {},
        faces: {},
        lines: {},
      }
    }
  }

  for (const shape of shapesJson) {
    const shapeFileId = shape.fileId.toString()

    if (metadataCollection[shapeFileId]) {
      metadataCollection[shapeFileId][`${shape.type}s`].push(shape)
    } else {
      if (
        !videoMetadataCollection[shapeFileId][`${shape.type}s`][shape.atFrame]
      ) {
        videoMetadataCollection[shapeFileId][`${shape.type}s`][shape.atFrame] =
          []
      }
      videoMetadataCollection[shapeFileId][`${shape.type}s`][
        shape.atFrame
      ].push(shape)
    }
  }

  const result = filesJson.map((file, index) => ({
    ...file,
    dbIndex: skip + index,
    metadata:
      file.type === 'video'
        ? videoMetadataCollection[file.id]
        : metadataCollection[file.id],
  }))
  return result
}

export const dbGetProjectUsers = async (projectId: string) => {
  const projectDoc = await ProjectModel.findById(projectId)
    .populate({ path: 'dataManagers', select: { name: 1, email: 1, id: 1 } })
    .populate({ path: 'reviewers', select: { name: 1, email: 1, id: 1 } })
    .populate({ path: 'annotators', select: { name: 1, email: 1, id: 1 } })

  return projectDoc
}

export const dbGetProjectsCount = async (orgId: string, userId?: string) => {
  const orgIdObject = getObjectId(orgId)
  if (!userId) {
    const count = await ProjectModel.countDocuments({
      orgId: orgIdObject,
    })
    return count
  }

  const userIdObject = getObjectId(userId)
  const count = await ProjectModel.countDocuments({
    orgId: orgIdObject,
    $or: [
      { dataManagers: { $elemMatch: { $eq: userIdObject } } },
      { reviewers: { $elemMatch: { $eq: userIdObject } } },
      { annotators: { $elemMatch: { $eq: userIdObject } } },
    ],
  })
  return count
}

export const dbListProjectsBy = async (
  orgId: string,
  userId?: string,
  skip: number = 0,
  limit: number = 20
) => {
  const orgIdObject = getObjectId(orgId)
  const projectSafeData = {
    name: 1,
    orgId: 1,
    dataManagers: 1,
    reviewers: 1,
    annotators: 1,
    createdAt: 1,
    modifiedAt: 1,
    storage: 1,
    isSyncing: 1,
    syncedAt: 1,
    taskType: 1,
    defaultClassId: 1,
  }

  if (!userId) {
    const projectList = await ProjectModel.find(
      { orgId: orgIdObject },
      projectSafeData
    )
    return projectList
  }

  const userIdObject = getObjectId(userId)
  const projectList = await ProjectModel.find(
    {
      orgId: orgIdObject,
      $or: [
        { dataManagers: { $elemMatch: { $eq: userIdObject } } },
        { reviewers: { $elemMatch: { $eq: userIdObject } } },
        { annotators: { $elemMatch: { $eq: userIdObject } } },
      ],
    },
    projectSafeData
  )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const projectListWithThumbnail = []
  for (const projectDoc of projectList) {
    const projectJson = projectDoc.toJSON()

    let thumbnail = null
    const fileDoc = await FileModel.findOne({
      projectId: projectJson._id,
      type: 'image',
    })
    if (fileDoc) {
      const fileJson = fileDoc.toJSON()
      thumbnail =
        !projectJson.storage || projectJson.storage === 'default'
          ? fileJson.relativePath
          : fileJson.url
    }

    projectListWithThumbnail.push({ ...projectJson, thumbnail })
  }

  return projectListWithThumbnail
}

export const dbDeleteProject = async (projectId: string) => {
  const projectDoc = await ProjectModel.findOne({ _id: projectId })
  if (!projectDoc) return null

  await projectDoc.deleteOne()
  // const projectJson = projectDoc.toJSON()
  // if (projectJson.storage === 'aws') {
  //   await deleteObjectsWithPrefix(
  //     projectJson.awsRegion,
  //     projectJson.awsApiVersion,
  //     projectJson.awsAccessKeyId,
  //     projectJson.awsSecretAccessKey,
  //     projectJson.awsBucketName,
  //     `${projectJson.id}/`
  //   )
  // }

  // if (projectJson.storage === 'azure') {
  //   await deleteContainer(
  //     projectJson.azureStorageAccount,
  //     projectJson.azurePassKey,
  //     projectJson.azureContainerName
  //   )
  // }
  return projectDoc
}

export const dbAddDataManagerToProject = async (
  projectId: string,
  dataManagerId: string
) => {
  const projectDoc = await ProjectModel.findById(projectId)
  if (!projectDoc) {
    throw new Error("Project doesn't exist")
  }

  const projectJson = projectDoc.toJSON()
  const dataManagers = projectJson.dataManagers.map((u) => u.toString())
  if (dataManagers.includes(dataManagerId)) {
    return
  }

  const userIdObj = getObjectId(dataManagerId)
  await ProjectModel.findOneAndUpdate(
    { _id: getObjectId(projectId) },
    {
      $push: { dataManagers: userIdObj },
      $pull: { annotators: userIdObj, reviewers: userIdObj },
    }
  )
}

export const dbAddReviewerToProject = async (
  projectId: string,
  reviewerId: string
) => {
  const projectDoc = await ProjectModel.findById(projectId)
  if (!projectDoc) {
    throw new Error("Project doesn't exist")
  }

  const projectJson = projectDoc.toJSON()
  const reviewers = projectJson.reviewers.map((u) => u.toString())
  if (reviewers.includes(reviewerId)) {
    return
  }

  const reviewerObjectId = getObjectId(reviewerId)
  await ProjectModel.findOneAndUpdate(
    { _id: getObjectId(projectId) },
    {
      $push: { reviewers: reviewerObjectId },
      $pull: { annotators: reviewerObjectId, dataManagers: reviewerObjectId },
    }
  )
}

export const dbAddAnnotatorToProject = async (
  projectId: string,
  annotatorId: string
) => {
  const projectDoc = await ProjectModel.findById(projectId)
  if (!projectDoc) {
    throw new Error("Project doesn't exist")
  }

  const projectJson = projectDoc.toJSON()
  const annotators = projectJson.annotators.map((u) => u.toString())
  if (annotators.includes(annotatorId)) {
    return
  }

  const annotatorObjectId = getObjectId(annotatorId)
  await ProjectModel.findOneAndUpdate(
    { _id: getObjectId(projectId) },
    {
      $push: { annotators: annotatorObjectId },
      $pull: { reviewers: annotatorObjectId, dataManagers: annotatorObjectId },
    }
  )
}

export const dbRemoveUserFromProject = async (
  projectId: string,
  userId: string
) => {
  const userObjectId = getObjectId(userId)
  const projectDoc = await ProjectModel.findOneAndUpdate(
    { _id: getObjectId(projectId) },
    {
      $pull: {
        dataManagers: userObjectId,
        reviewers: userObjectId,
        annotators: userObjectId,
      },
    }
  )

  await dbRevertImagesFromUser(projectId, userId)

  return projectDoc
}

export const getProjectBasicInfo = async (projectId: string) => {
  const stats = await FileModel.aggregate([
    {
      $match: {
        projectId: getObjectId(projectId),
      },
    },
    {
      // Group everything to get the total counts
      $group: {
        _id: null, // We don't want to group by any specific field, just get overall stats
        files: { $sum: 1 }, // Total number of files
        completed: {
          $sum: { $cond: [{ $eq: ['$complete', true] }, 1, 0] }, // Count where complete is true
        },
        skipped: {
          $sum: { $cond: [{ $eq: ['$skipped', true] }, 1, 0] }, // Count where skipped is true
        },
        remaining: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$complete', false] },
                  { $eq: ['$skipped', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      // Project the final result to remove the _id field
      $project: {
        _id: 0,
        files: 1,
        completed: 1,
        skipped: 1,
        remaining: 1,
      },
    },
  ])
  return stats[0]
}

export const dbGetAnnotatorsStats = async (projectId: string) => {
  const projectDoc = await ProjectModel.findOne({ _id: getObjectId(projectId) })
  if (!projectDoc) {
    return null
  }

  const projectJson = projectDoc.toJSON()
  const annotatorIds = projectJson.annotators.map((annotatorId) =>
    getObjectId(annotatorId)
  )
  const reviewerIds = projectJson.reviewers.map((reviewerId) =>
    getObjectId(reviewerId)
  )
  const dataManagerIds = projectJson.dataManagers.map((dataManagerId) =>
    getObjectId(dataManagerId.toString())
  )
  const allUsers = [...annotatorIds, ...reviewerIds, ...dataManagerIds]

  const stats = await FileModel.aggregate([
    {
      $match: {
        projectId: getObjectId(projectId),
        annotator: { $in: allUsers },
      },
    },
    {
      $group: {
        _id: '$annotator',
        assignedCount: { $sum: 1 },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$complete', true] }, 1, 0] },
        },
        skippedCount: {
          $sum: { $cond: [{ $eq: ['$skipped', true] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $unwind: {
        path: '$userInfo',
        preserveNullAndEmptyArrays: true, // In case there are users without emails
      },
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        userName: '$userInfo.name',
        assignedCount: '$assignedCount',
        completedCount: '$completedCount',
        skippedCount: '$skippedCount',
      },
    },
  ])

  for (const userId of allUsers) {
    const userStats = stats.find(
      (stat) => stat.userId.toString() === userId.toString()
    )
    if (!userStats) {
      const userDoc = await UserService.dbFindUserById(userId.toString())
      stats.push({
        userId: userId.toString(),
        userName: userDoc?.name || '-',
        assignedCount: 0,
        completedCount: 0,
        skippedCount: 0,
      })
    }
  }

  return stats

  // const stats = await ActionModel.aggregate([
  //   // Step 1: Filter by projectId
  //   {
  //     $match: {
  //       projectId: getObjectId(projectId),
  //       userId: { $in: annotatorIds },
  //     },
  //   },

  //   // Step 2: Lookup to join the files collection to ensure the file has the user as the annotator
  //   {
  //     $lookup: {
  //       from: 'files', // Name of the files collection
  //       localField: 'fileId', // Field from the actions collection
  //       foreignField: '_id', // Field from the files collection
  //       as: 'fileInfo', // Output field for file info
  //     },
  //   },

  //   // Step 3: Unwind the fileInfo array to work with individual file documents
  //   {
  //     $unwind: {
  //       path: '$fileInfo',
  //       preserveNullAndEmptyArrays: false, // Ensure files without info are excluded
  //     },
  //   },

  //   // Step 4: Match to ensure the user is the annotator of the file
  //   {
  //     $match: {
  //       $expr: { $eq: ['$fileInfo.annotator', '$userId'] }, // Check if user is annotator
  //     },
  //   },

  //   // Step 5: Group by userId and fileId to ensure each fileId is counted only once for "viewed" and "skipped"
  //   {
  //     $group: {
  //       _id: { userId: '$userId', fileId: '$fileId' },
  //       viewedExists: {
  //         $max: { $cond: [{ $eq: ['$name', 'viewed'] }, 1, 0] },
  //       },
  //       annotatedExists: {
  //         $max: { $cond: [{ $eq: ['$name', 'annotated'] }, 1, 0] },
  //       },
  //       skippedExists: {
  //         $max: { $cond: [{ $eq: ['$name', 'skipped'] }, 1, 0] },
  //       },
  //     },
  //   },

  //   // Step 6: Group again to get the total count of distinct fileIds for each user
  //   {
  //     $group: {
  //       _id: '$_id.userId', // Group by userId
  //       totalViewed: { $sum: '$viewedExists' }, // Sum viewed counts
  //       totalAnnotated: { $sum: '$annotatedExists' }, // Sum annotated counts
  //       totalSkipped: { $sum: '$skippedExists' }, // Sum skipped counts
  //     },
  //   },

  //   // Step 7: Join with the users collection to get userName
  //   {
  //     $lookup: {
  //       from: 'users', // Name of the users collection
  //       localField: '_id', // Field from the input documents
  //       foreignField: '_id', // Field from the users collection
  //       as: 'userInfo', // Output array field
  //     },
  //   },

  //   // Step 8: Unwind the userInfo array to flatten the structure
  //   {
  //     $unwind: {
  //       path: '$userInfo',
  //       preserveNullAndEmptyArrays: true, // In case there are users without emails
  //     },
  //   },

  //   // Step 9: Add another lookup to count files for each user
  //   {
  //     $lookup: {
  //       from: 'files', // Name of the files collection
  //       localField: '_id', // This is the userId from the previous grouping
  //       foreignField: 'annotator', // This is the annotator field in the files collection
  //       as: 'userFiles', // Output array field for user files
  //     },
  //   },

  //   // Step 10: Count the files for each user
  //   {
  //     $addFields: {
  //       assignedCount: { $size: '$userFiles' }, // Count the number of files for each user
  //     },
  //   },

  //   // Step 11: Project the final result in a readable format
  //   {
  //     $project: {
  //       _id: 0,
  //       userId: '$_id', // Include userId
  //       userName: '$userInfo.name', // Include userName from the userInfo
  //       viewedCount: '$totalViewed', // Include total viewed count
  //       annotatedCount: '$totalAnnotated', // Include total annotated
  //       skippedCount: '$totalSkipped', // Include total skipped count
  //       assignedCount: 1,
  //     },
  //   },
  // ])
}

export const dbAddAutoAnnotations = async (
  orgId: string,
  projectId: string,
  prompts: {
    [fileName: string]: {
      type: 'polygon' | 'rectangle'
      classId?: string
      points: { x: number; y: number }[]
      x: number
      y: number
      w: number
      h: number
    }[]
  }
) => {
  const fileNameToId: { [fileName: string]: string } = {}
  const classIdToColor: { [classId: string]: string } = {}
  const shapesToInsert: Omit<Omit<ShapeType, 'id'>, '_id'>[] = []

  const filesCount = await FileModel.countDocuments({
    orgId: getObjectId(orgId),
    projectId: getObjectId(projectId),
    complete: false,
    skipped: false,
  })
  let fileSkip = 0
  while (fileSkip < filesCount) {
    const fileDocs = await FileModel.find(
      {
        orgId: getObjectId(orgId),
        projectId: getObjectId(projectId),
        complete: false,
        skipped: false,
      },
      { _id: 1, name: 1 }
    )
      .limit(1000)
      .skip(fileSkip)
    for (const fileDoc of fileDocs) {
      fileNameToId[fileDoc.name] = fileDoc._id.toString()
    }

    fileSkip += 1000
  }

  for (const fileName in fileNameToId) {
    const fileId = fileNameToId[fileName]
    if (!fileId) {
      continue
    }

    const shapesJson: {
      type: 'polygon' | 'rectangle'
      classId?: string
      points: { x: number; y: number }[]
      x: number
      y: number
      w: number
      h: number
    }[] = prompts[fileName]
    if (!shapesJson) {
      continue
    }

    for (let i = 0; i < shapesJson.length; i++) {
      const shape = shapesJson[i]

      let color = 'rgb(255, 0, 0)'
      if (shape.classId) {
        if (classIdToColor[shape.classId]) {
          color = classIdToColor[shape.classId]
        } else {
          const classDoc = await AnnotationClassModel.findById(shape.classId)
          if (classDoc) {
            color = classDoc.color
            classIdToColor[shape.classId] = classDoc.color
          }
        }
      }

      shapesToInsert.push({
        orgId: getObjectId(orgId),
        projectId: getObjectId(projectId),
        fileId: getObjectId(fileId),
        type: shape.type,
        ...(shape.x && { x: shape.x }),
        ...(shape.y && { y: shape.y }),
        ...(shape.w && { width: shape.w }),
        ...(shape.h && { height: shape.h }),
        ...(shape.classId && { classId: getObjectId(shape.classId) }),
        ...(shape.points && {
          points: shape.points.map((v) => ({
            id: getObjectId().toString(),
            x: v.x,
            y: v.y,
          })),
        }),
        name: `auto ${i + 1}`,
        stroke: color,
        atFrame: 1,
        strokeWidth: 2,
        notes: '',
      })
    }
  }

  let skip = 0
  while (skip < shapesToInsert.length) {
    await ShapeModel.insertMany(shapesToInsert.slice(skip, skip + 1000))
    skip += 1000
  }
}

export const dbExportAnnotations = async (projectId: string) => {
  const exportJson: {
    [fileName: string]: {
      height?: number
      width?: number
      status: 'completed' | 'skipped' | ''
      completedAt: Date | string | undefined
      completedBy: string
      annotations: {
        points: any
        className: string
      }[]
    }
  } = {}
  // Creating userId to userName mapping
  const userIdToName: { [userId: string]: string } = {}
  const userDocs = await UserModel.find({})
  for (const userDoc of userDocs) {
    userIdToName[userDoc._id.toString()] = userDoc.name
  }

  const classDocs = await AnnotationClassModel.find({
    projectId: getObjectId(projectId),
  })
  const classIdToName: { [classId: string]: string } = {}
  for (const classDoc of classDocs) {
    classIdToName[classDoc._id.toString()] = classDoc.name
  }

  const filesCount = await FileModel.countDocuments({
    projectId: getObjectId(projectId),
  })

  let skip = 0
  let limit = 1000
  while (skip < filesCount) {
    const files = await FileModel.find({
      projectId: getObjectId(projectId),
    })
      .sort({ createdAt: 'asc' })
      .skip(skip)
      .limit(limit)

    const fileIdToName: { [fileName: string]: string } = {}
    for (const file of files) {
      const fileJson = file.toJSON()
      fileIdToName[fileJson._id.toString()] = fileJson.name

      // Converting UTC date to EST
      let completedAt: Date | string | undefined = fileJson.complete
        ? fileJson.completedAt
        : fileJson.skipped
        ? fileJson.skippedAt
        : undefined
      if (completedAt) {
        const timeZone = 'America/New_York'
        const easternTime = toZonedTime(new Date(completedAt), timeZone)
        const formattedDate = format(easternTime, 'yyyy-MM-dd HH:mm:ss', {
          timeZone,
        })
        completedAt = formattedDate
      }

      // Handling status
      let status: 'completed' | 'skipped' | '' = ''
      if (fileJson.complete) {
        status = 'completed'
      } else if (fileJson.skipped) {
        status = 'skipped'
      }

      exportJson[fileJson.name] = {
        ...(fileJson.height && { height: fileJson.height }),
        ...(fileJson.width && { width: fileJson.width }),
        status,
        completedAt,
        completedBy: fileJson.annotator
          ? userIdToName[fileJson.annotator.toString()]
          : '',
        annotations: [],
      }
    }

    const fileIds = files.map((file) => file._id)
    const shapes = await ShapeModel.find({
      fileId: { $in: fileIds },
    })

    for (const shape of shapes) {
      const shapeJson = shape.toJSON()
      const fileId = shapeJson.fileId.toString()
      const classId = shapeJson.classId
      let className = ''
      if (classId) {
        className = classIdToName[classId?.toString()]
      }
      const fileName = fileIdToName[fileId]

      if (shape.type === 'rectangle') {
        let dx = shapeJson.x! + shapeJson.width!
        let dy = shapeJson.y! + shapeJson.height!

        let x1 = Math.min(shapeJson.x!, dx)
        let y1 = Math.min(shapeJson.y!, dy)
        let x2 = Math.max(shapeJson.x!, dx)
        let y2 = Math.max(shapeJson.y!, dy)
        let w = x2 - x1
        let h = y2 - y1

        exportJson[fileName].annotations.push({
          points: [
            { x: parseFloat(x1.toFixed(3)), y: parseFloat(y1.toFixed(3)) },
            {
              x: parseFloat((x1 + w).toFixed(3)),
              y: parseFloat(y1.toFixed(3)),
            },
            {
              x: parseFloat(x1.toFixed(3)),
              y: parseFloat((y1 + h).toFixed(3)),
            },
            { x: parseFloat(x2.toFixed(3)), y: parseFloat(y2.toFixed(3)) },
          ],
          className: className,
        })
      } else if (
        shape.type === 'polygon' &&
        shapeJson.points &&
        shapeJson.points.length > 0
      ) {
        exportJson[fileName].annotations.push({
          points: shapeJson.points.map((p) => ({
            x: parseFloat(p.x.toFixed(3)),
            y: parseFloat(p.y.toFixed(3)),
          })),
          className: className,
        })
      }
    }

    skip += limit
  }
  return exportJson
}

export const dbExportClassifications = async (projectId: string) => {
  const exportJson: {
    [fileName: string]: {
      height?: number
      width?: number
      status: 'completed' | 'skipped' | ''
      completedAt: Date | string | undefined
      completedBy: string
      classes: string[]
    }
  } = {}

  // Creating userId to userName mapping
  const userIdToName: { [userId: string]: string } = {}
  const userDocs = await UserModel.find({})
  for (const userDoc of userDocs) {
    userIdToName[userDoc._id.toString()] = userDoc.name
  }

  const annotationClasses = await AnnotationClassModel.find({
    projectId: getObjectId(projectId),
  })
  const classIdToName: { [classId: string]: string } = {}
  for (const annotationClass of annotationClasses) {
    const annotationClassJson = annotationClass.toJSON()
    classIdToName[annotationClassJson._id.toString()] = annotationClassJson.name
  }

  const filesCount = await FileModel.countDocuments({
    projectId: getObjectId(projectId),
  })

  let skip = 0
  let limit = 1000
  while (skip < filesCount) {
    const files = await FileModel.find({
      projectId: getObjectId(projectId),
    })
      .sort({ createdAt: 'asc' })
      .skip(skip)
      .limit(limit)

    for (const file of files) {
      const fileJson = file.toJSON()

      // Converting UTC date to EST
      let completedAt: Date | string | undefined = fileJson.complete
        ? fileJson.completedAt
        : fileJson.skipped
        ? fileJson.skippedAt
        : undefined
      if (completedAt) {
        const timeZone = 'America/New_York'
        const easternTime = toZonedTime(new Date(completedAt), timeZone)
        const formattedDate = format(easternTime, 'yyyy-MM-dd HH:mm:ss', {
          timeZone,
        })
        completedAt = formattedDate
      }

      // Handling status
      let status: 'completed' | 'skipped' | '' = ''
      if (fileJson.complete) {
        status = 'completed'
      } else if (fileJson.skipped) {
        status = 'skipped'
      }

      exportJson[fileJson.name] = {
        ...(fileJson.height && { height: fileJson.height }),
        ...(fileJson.width && { width: fileJson.width }),
        status,
        completedAt,
        completedBy: fileJson.annotator
          ? userIdToName[fileJson.annotator.toString()]
          : '',
        classes: [],
      }

      for (const tag of fileJson.tags) {
        const className = classIdToName[tag.toString()]
        if (className) {
          exportJson[fileJson.name].classes.push(className)
        }
      }
    }

    skip += limit
  }

  return exportJson
}

export const dbExportImageStats = async (projectId: string) => {
  const projectDoc = await ProjectModel.findOne({ _id: getObjectId(projectId) })
  if (!projectDoc) {
    return null
  }

  // Creating userId to userName mapping
  const userIdToName: { [userId: string]: string } = {}
  const userDocs = await UserModel.find({})
  for (const userDoc of userDocs) {
    userIdToName[userDoc._id.toString()] = userDoc.name
  }

  // Creating classId to className mapping
  const classIdToName: { [classId: string]: string } = {}
  const classDocs = await AnnotationClassModel.find({
    projectId: getObjectId(projectId),
  })
  for (const classDoc of classDocs) {
    classIdToName[classDoc._id.toString()] = classDoc.name
  }

  const projectJson = projectDoc.toJSON()
  const result: {
    name: string
    height?: number
    width?: number
    status: 'completed' | 'skipped' | ''
    completedAt: Date | string | undefined
    completedBy: string
    classes: string[]
  }[] = []
  const filesCount = await FileModel.countDocuments()
  let skip = 0
  while (skip < filesCount) {
    const files = await FileModel.find({ projectId: getObjectId(projectId) })
      .skip(skip)
      .limit(1000)
    for (const file of files) {
      const fileJson = file.toJSON()

      // Handling filename
      let fileName = fileJson.name
      const containerName =
        projectJson.storage === 'azure' ? projectJson.azureContainerName : null
      if (containerName) {
        fileName = `${containerName.split('/')[0]}/${fileName}`
      }

      // Converting UTC date to EST
      let completedAt: Date | string | undefined = fileJson.complete
        ? fileJson.completedAt
        : fileJson.skipped
        ? fileJson.skippedAt
        : undefined
      if (completedAt) {
        const timeZone = 'America/New_York'
        const easternTime = toZonedTime(new Date(completedAt), timeZone)
        const formattedDate = format(easternTime, 'yyyy-MM-dd HH:mm:ss', {
          timeZone,
        })
        completedAt = formattedDate
      }

      // Handling status
      let status: 'completed' | 'skipped' | '' = ''
      if (fileJson.complete) {
        status = 'completed'
      } else if (fileJson.skipped) {
        status = 'skipped'
      }

      result.push({
        name: fileName,
        status: status,
        completedAt: completedAt,
        completedBy: fileJson.annotator
          ? userIdToName[fileJson.annotator.toString()]
          : '',
        classes: fileJson.tags.map((tag) => classIdToName[tag.toString()]),
        ...(fileJson.height && { height: fileJson.height }),
        ...(fileJson.width && { width: fileJson.width }),
      })
    }
    skip += 1000
  }

  const csvResult = parse(result)
  return csvResult
}

export const dbRevertImagesFromUser = async (
  projectId: string,
  userId: string
) => {
  await FileModel.updateMany(
    {
      projectId: getObjectId(projectId),
      annotator: getObjectId(userId),
      complete: false,
    },
    { $set: { annotator: null, assignedAt: null } }
  )
}

export const dbGetCompletedRangeStats = async (
  projectId: string,
  start: Date,
  end: Date
) => {
  const allDates: { [date: string]: number } = {}
  let currentDate = new Date(start)
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0] // YYYY-MM-DD
    allDates[dateStr] = 0 // Initialize with 0
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Step 1: Aggregate completed and skipped counts per annotator per day
  const result = await FileModel.aggregate([
    {
      $match: {
        projectId: getObjectId(projectId),
        $or: [
          { completedAt: { $gte: start, $lte: end } },
          { skippedAt: { $gte: start, $lte: end } },
        ],
      },
    },
    {
      $project: {
        annotator: 1,
        date: {
          $cond: {
            if: { $gt: ['$completedAt', '$skippedAt'] },
            then: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
            },
            else: { $dateToString: { format: '%Y-%m-%d', date: '$skippedAt' } },
          },
        },
        total: {
          $add: [
            { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] },
            { $cond: [{ $ifNull: ['$skippedAt', false] }, 1, 0] },
          ],
        },
      },
    },
    {
      $group: {
        _id: { annotator: '$annotator', date: '$date' },
        total: { $sum: '$total' },
      },
    },
    {
      $group: {
        _id: '$_id.annotator',
        series: {
          $push: {
            date: '$_id.date',
            total: '$total',
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'annotator',
      },
    },
    {
      $unwind: '$annotator',
    },
    {
      $project: {
        _id: 0,
        annotatorId: '$_id',
        annotatorName: '$annotator.name',
        annotatorEmail: '$annotator.email',
        series: 1,
      },
    },
  ])

  // Step 2: Fill missing dates with total 0
  const finalResult = result.map(
    (user: {
      annotatorId: string
      annotatorName: string
      annotatorEmail: string
      series: { date: string; total: number }[]
    }) => {
      // Create a full date range for each annotator
      const filledSeries = { ...allDates } // Clone the date map with zeros

      // Populate actual data from aggregation result
      user.series.forEach(({ date, total }) => {
        filledSeries[date] = total
      })

      // Convert back to an array format
      user.series = Object.entries(filledSeries).map(([date, total]) => ({
        date: new Date(date).toUTCString(),
        total,
      }))

      return user
    }
  )

  return finalResult.sort((a, b) =>
    a.annotatorName.localeCompare(b.annotatorName)
  )
}

export const dbGetTopAnnotators = async (
  projectId: string,
  start: Date,
  end: Date
) => {
  const result = await FileModel.aggregate([
    {
      $match: {
        projectId: getObjectId(projectId), // Filter by project
        $or: [
          { completedAt: { $gte: start, $lte: end } },
          { skippedAt: { $gte: start, $lte: end } },
        ],
      },
    },
    {
      $group: {
        _id: '$annotator',
        completed: {
          $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] },
        },
        skipped: {
          $sum: { $cond: [{ $ifNull: ['$skippedAt', false] }, 1, 0] },
        },
      },
    },
    {
      $sort: { completed: -1 }, // Sort by completed count in descending order
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'annotator',
      },
    },
    {
      $unwind: '$annotator',
    },
    {
      $project: {
        _id: 0,
        annotatorId: '$_id',
        annotatorName: '$annotator.name',
        annotatorEmail: '$annotator.email',
        completed: 1,
        skipped: 1,
      },
    },
  ])
  return result
}
