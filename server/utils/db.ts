import mongoose from 'mongoose'

export const getObjectId = (id?: string) => {
  return new mongoose.Types.ObjectId(id)
}
