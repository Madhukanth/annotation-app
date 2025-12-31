import { getObjectId } from '../../utils/db'
import ActionModel from './action.model'

export const dbCreateAction = async (newAction: any) => {
  const actionDoc = await ActionModel.create({ ...newAction })
  return actionDoc
}

export const dbFindAction = async (
  projectId: string,
  userId: string,
  start: string,
  end: string
) => {
  const actionDocs = await ActionModel.find({
    projectId: getObjectId(projectId),
    userId: getObjectId(userId),
    createdAt: { $gte: new Date(start), $lte: new Date(end) },
  })
  return actionDocs
}
