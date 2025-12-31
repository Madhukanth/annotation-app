import mongoose from 'mongoose'
import { DB_MODEL_NAMES } from '../../config/vars'

export const userRoles = ['superadmin', 'orgadmin', 'user'] as const
export type UserRoleType = (typeof userRoles)[number]

export type UserType = {
  id: string
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password: string
  role: UserRoleType
}

const userSchema = new mongoose.Schema<UserType>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, minlength: 6, required: true },
    role: { type: String, enum: userRoles, required: true },
  },
  {
    timestamps: true,
    id: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        delete ret._id
      },
    },
  }
)

const UserModel = mongoose.model(DB_MODEL_NAMES.User, userSchema)
export default UserModel
