import dotenv from 'dotenv'

dotenv.config()

const envs = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  LOGS: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  FLAGS: '%5B%5D',
  DATA_ROOT: process.env.DATA_ROOT,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_REGION: process.env.AWS_REGION,
  AWS_API_VERSION: process.env.AWS_API_VERSION,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
  AZ_STORAGE_ACCNT: process.env.AZ_STORAGE_ACCNT!,
  AZ_PASS_KEY: process.env.AZ_PASS_KEY!,
}

export const DB_MODEL_NAMES = {
  User: 'User',
  Project: 'Project',
  Organization: 'Organization',
  File: 'File',
  Invitation: 'Invitation',
  Action: 'Action',
  Comment: 'Comment',
  CommentFile: 'CommentFile',
  AnnotationClass: 'AnnotationClass',
  Shape: 'Shape',
}

export const CONSTANTS = {
  imgExts: ['.jpeg', '.jpg', '.png', '.webp'],
  videoExts: ['.mp4', '.mov', '.avi', '.mkv'],
}

export default envs
