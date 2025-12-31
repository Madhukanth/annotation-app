import { hashPassword } from '../auth/auth.utils'
import OrganizationModel from '../organizations/organization.model'
import UserModel, { UserType } from './user.model'

export const dbCreateUser = async (
  newUser: Omit<Omit<UserType, 'id'>, '_id'>,
  orgId: string
) => {
  const userDoc = await UserModel.create({
    ...newUser,
    email: newUser.email.toLowerCase(),
  })
  await OrganizationModel.findByIdAndUpdate(orgId, {
    $push: { users: userDoc._id },
  })
  return userDoc
}

export const dbFindUserById = async (userId: string) => {
  const userDoc = await UserModel.findById(userId, {
    name: 1,
    email: 1,
    role: 1,
    id: 1,
  })
  return userDoc
}

export const dbFindUserByEmail = async (email: string) => {
  const userDoc = await UserModel.findOne({ email: email.toLowerCase() })
  return userDoc
}

export const dbSearchUsersBy = async (searchTerm?: string) => {
  let query = {}
  if (searchTerm) {
    query = {
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }
  }

  const userDocs = await UserModel.find(query, {
    name: 1,
    email: 1,
    role: 1,
  }).limit(20)
  return userDocs
}

export const dbFindUsersByOrgId = async (orgId: string) => {
  const orgDoc = await OrganizationModel.findById(orgId)
  if (!orgDoc) return null

  const users = []
  for (const userId of orgDoc.toJSON().users) {
    const user = await dbFindUserById(userId.toString())
    if (user) {
      users.push(user.toJSON())
    }
  }
  return users
}

export const dbUpdateUserById = async (
  userId: string,
  uData: Partial<UserType>
) => {
  if (uData.password) {
    uData.password = await hashPassword(uData.password)
  }

  if (uData.email) {
    uData.email = uData.email.toLowerCase()
  }

  const userDoc = await UserModel.findByIdAndUpdate({ _id: userId }, uData, {
    new: true,
  })
  return userDoc?.toJSON()
}

export const dbDeleteUserById = (userId: string) => {
  const userDoc = UserModel.findByIdAndDelete(userId)
  return userDoc
}

export const dbGetAllSuperAdmins = async () => {
  const userDocs = await UserModel.find(
    { role: 'superadmin' },
    { name: 1, email: 1, _id: 1 }
  )
  return userDocs
}

export const dbGetOrgAdmin = async (orgId: string) => {
  const orgDoc = await OrganizationModel.findById(orgId)
  if (!orgDoc) return null

  return orgDoc.toJSON().orgadmin
}
