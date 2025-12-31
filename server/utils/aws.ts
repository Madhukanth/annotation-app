import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs'

const createS3Client = (
  region: string,
  apiVersion: string,
  accessKeyId: string,
  secretAccessKey: string
) => {
  return new S3Client({
    region,
    apiVersion,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export const createGetPresignedURL = async (
  region: string,
  apiVersion: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string
) => {
  const client = createS3Client(
    region,
    apiVersion,
    accessKeyId,
    secretAccessKey
  )

  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: 60 * 60 * 24 * 7,
  })

  return signedUrl
}

export const createPutPresignedUrl = async (
  region: string,
  apiVersion: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  type: string
) => {
  const client = createS3Client(
    region,
    apiVersion,
    accessKeyId,
    secretAccessKey
  )

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: type,
  })
  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: 60 * 60 * 24 * 7,
  })
  return signedUrl
}

export const deleteObject = async (
  region: string,
  apiVersion: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string
) => {
  try {
    const client = createS3Client(
      region,
      apiVersion,
      accessKeyId,
      secretAccessKey
    )
    const delCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    const data = await client.send(delCommand)
    return data
  } catch {}
}

export const listObjectsWithPrefix = async (
  region: string,
  apiVersion: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  prefix?: string
) => {
  const client = createS3Client(
    region,
    apiVersion,
    accessKeyId,
    secretAccessKey
  )

  const listCommand = new ListObjectsCommand({
    Bucket: bucket,
    Prefix: prefix,
  })
  const { Contents } = await client.send(listCommand)
  if (!Contents) return []

  return Contents.filter(({ Key }) => !!Key).map(({ Key }) => ({
    Key,
  }))
}

export const deleteObjectsWithPrefix = async (
  region: string,
  apiVersion: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  prefix: string
) => {
  const client = createS3Client(
    region,
    apiVersion,
    accessKeyId,
    secretAccessKey
  )

  const deleteKeys = await listObjectsWithPrefix(
    region,
    apiVersion,
    accessKeyId,
    secretAccessKey,
    bucket,
    prefix
  )

  const delCommand = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: deleteKeys },
  })
  const data = await client.send(delCommand)
  return data
}

export const uploadLocalFile = async (
  region: string,
  apiVersion: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  type: string,
  filePath: string
) => {
  const client = createS3Client(
    region,
    apiVersion,
    accessKeyId,
    secretAccessKey
  )

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: type,
    Body: fs.createReadStream(filePath),
  })

  const data = await client.send(command)
  return data
}
