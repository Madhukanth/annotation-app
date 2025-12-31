import OrganizationModel from './organization.model'
import { getObjectId } from '../../utils/db'

export const dbCreateOrganization = async (name: string, adminId: string) => {
  const adminIdObj = getObjectId(adminId)
  const newOrgDoc = await OrganizationModel.create({
    name,
    orgadmin: adminIdObj,
    users: [adminIdObj],
  })
  return newOrgDoc
}

export const dbGetOrganizations = async (userId?: string) => {
  if (!userId) {
    const orgDocs = await OrganizationModel.find().limit(30)
    return orgDocs
  }

  const orgDocs = await OrganizationModel.find({
    users: { $elemMatch: { $eq: getObjectId(userId) } },
  })
  return orgDocs
}

export const dbAddUserToOrg = async (orgId: string, userId: string) => {
  const orgObjectId = getObjectId(orgId)
  const userObjectId = getObjectId(userId)

  const updatedOrgDoc = await OrganizationModel.findOneAndUpdate(
    { _id: orgObjectId },
    { $addToSet: { users: userObjectId } }
  )
  return updatedOrgDoc
}
