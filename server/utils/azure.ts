import fs from 'fs'
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob'

import * as FileService from '../modules/files/file.service'
import * as ProjectService from '../modules/projects/project.service'
import { FileTypesType } from '../modules/files/file.model'
import path from 'path'
import { CONSTANTS } from '../config/vars'
import { ProjectType, Storage } from '../modules/projects/project.model'
import logger from '../config/logger'

const createCredentials = (account: string, passkey: string) => {
  return new StorageSharedKeyCredential(account, passkey)
}

export const createAzureClient = (account: string, passkey: string) => {
  const credentials = createCredentials(account, passkey)
  return new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credentials
  )

  // return new BlobServiceClient(
  //   `https://${account}.blob.core.windows.net?${passkey}`
  // )
}

// Default 3 years
const SAS_EXPIRES = (days = 3 * 365) => {
  return new Date(new Date().setDate(new Date().getDate() + days))
}

export const getSASToken = (
  account: string,
  passkey: string,
  containerName: string,
  blobName: string,
  expireInDays: number
) => {
  const credentials = createCredentials(account, passkey)
  return generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      startsOn: new Date(),
      expiresOn: SAS_EXPIRES(expireInDays),
      permissions: BlobSASPermissions.parse('racwd'),
      protocol: SASProtocol.HttpsAndHttp,
    },
    credentials
  ).toString()
}

function getFilesizeInBytes(filename: string) {
  const stats = fs.statSync(filename)
  const fileSizeInBytes = stats.size
  return fileSizeInBytes
}

export const getBlobUrl = async (
  account: string,
  passkey: string,
  containerName: string,
  blobName: string,
  expireInDays: number = 2
) => {
  const client = createAzureClient(account, passkey)
  await createContainer(account, passkey, containerName)
  const containerClient = client.getContainerClient(containerName)
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)
  const sasToken = getSASToken(
    account,
    passkey,
    containerName,
    blobName,
    expireInDays
  )
  return `${blockBlobClient.url}?${sasToken}`
}

export const createContainer = async (
  account: string,
  passkey: string,
  containerName: string
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)
  await containerClient.createIfNotExists({ access: 'container' })
}

export const deleteContainer = async (
  account: string,
  passkey: string,
  containerName: string
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)
  await containerClient.deleteIfExists()
}

export const uploadLocalFile = async (
  account: string,
  passkey: string,
  containerName: string,
  blobName: string,
  srcFileURL: string,
  onProgress?: (percent: number) => void
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)

  const srcFileSize = getFilesizeInBytes(srcFileURL)
  let prevPercent = 0
  const uploadRes = await blockBlobClient.uploadFile(srcFileURL, {
    blockSize: 4 * 1024 * 1024, // 4MB
    concurrency: 5,
    onProgress: (ev) => {
      if (!onProgress) return

      const percent = Math.round((ev.loadedBytes / srcFileSize) * 100)
      if (percent !== prevPercent) {
        prevPercent = percent
        onProgress(percent)
      }
    },
  })

  return uploadRes
}

export const downloadFileToLocal = async (
  account: string,
  passkey: string,
  containerName: string,
  blobName: string,
  dstFileURL: string
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)

  const downloadRes = await blockBlobClient.downloadToFile(dstFileURL)
  return downloadRes
}

export const deleteBlob = async (
  account: string,
  passkey: string,
  containerName: string,
  blobName: string
) => {
  try {
    const client = createAzureClient(account, passkey)
    const containerClient = client.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    const deleteRes = await blockBlobClient.deleteIfExists()
    return deleteRes
  } catch {}
}

export const doesBlobExist = async (
  account: string,
  passkey: string,
  containerName: string,
  blobName: string
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)
  return blockBlobClient.exists()
}

export const deleteRecursively = async (
  account: string,
  passkey: string,
  containerName: string,
  prefix: string
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)
  const blobsList = await containerClient.listBlobsFlat({ prefix })
  for await (const blob of blobsList) {
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name)
    await blockBlobClient.deleteIfExists({ deleteSnapshots: 'include' })
  }
}

export const copyBlob = async (
  account: string,
  passkey: string,
  containerName: string,
  srcBlobName: string,
  dstBlobName: string
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)
  const srcBlockBlobClient = await containerClient.getBlockBlobClient(
    srcBlobName
  )
  const dstBlockBlobClient = await containerClient.getBlockBlobClient(
    dstBlobName
  )

  const copyPoller = await dstBlockBlobClient.beginCopyFromURL(
    srcBlockBlobClient.url
  )
  await copyPoller.pollUntilDone()
}

export const getAllBlobs = async (
  account: string,
  passkey: string,
  containerName: string,
  prefix?: string
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)

  const blobNames: string[] = []
  for await (const item of containerClient.listBlobsByHierarchy('/', {
    prefix: prefix,
    includeMetadata: true,
  })) {
    blobNames.push(item.name)
  }

  return blobNames
}

export const listBlobsAndCreateFiles = async (
  account: string,
  passkey: string,
  containerName: string,
  projectJson: ProjectType,
  syncedAt?: Date,
  prefix?: string
) => {
  try {
    await ProjectService.dbUpdateProject(projectJson.id, { isSyncing: true })

    const client = createAzureClient(account, passkey)
    const containerClient = client.getContainerClient(containerName)

    for await (const response of containerClient
      .listBlobsByHierarchy('/', {
        prefix: prefix === '/' ? undefined : prefix,
      })
      .byPage({ maxPageSize: 1000 })) {
      const segment = response.segment
      const rawFiles: {
        orgId: string
        projectId: string
        storedIn: Storage
        blobName: string
        url: string
      }[] = []

      for (const blob of segment.blobItems) {
        const blobName = blob.name
        const ext = path.extname(blobName)
        const type: FileTypesType | null = CONSTANTS.imgExts.includes(ext)
          ? 'image'
          : null

        if (!type) {
          continue
        }

        if (syncedAt) {
          const blobDetails = await containerClient
            .getBlobClient(blob.name)
            .getProperties()

          if (
            blobDetails.lastModified &&
            new Date(blobDetails.lastModified).valueOf() <
              new Date(syncedAt).valueOf()
          ) {
            continue
          }
        }

        const expiresOn = new Date()
        expiresOn.setDate(expiresOn.getDate() + 1000)
        const blobClient = containerClient.getBlobClient(blobName)
        const url = await blobClient.generateSasUrl({
          startsOn: new Date(),
          expiresOn: expiresOn,
          permissions: BlobSASPermissions.parse('racwd'),
          protocol: SASProtocol.HttpsAndHttp,
        })

        rawFiles.push({
          blobName: blobName,
          url: url,
          projectId: projectJson.id,
          orgId: projectJson.orgId.toString(),
          storedIn: 'azure',
        })
      }

      if (rawFiles.length > 0) {
        await FileService.dbCreateFilesFromCloud(rawFiles)
      }
    }

    await ProjectService.dbUpdateProject(projectJson.id, {
      isSyncing: false,
      syncedAt: new Date(),
    })
  } catch (err) {
    logger.error(err)
    await ProjectService.dbUpdateProject(projectJson.id, {
      isSyncing: false,
    })
  }
}

export const addAzureFilesToDb = async (
  account: string,
  passkey: string,
  containerName: string,
  projectJson: ProjectType,
  blobNames: string[]
) => {
  const client = createAzureClient(account, passkey)
  const containerClient = client.getContainerClient(containerName)

  const rawFiles: {
    orgId: string
    projectId: string
    storedIn: Storage
    blobName: string
    url: string
  }[] = []

  for (const blobName of blobNames) {
    const ext = path.extname(blobName)
    const isImage: FileTypesType | null = CONSTANTS.imgExts.includes(ext)
      ? 'image'
      : null

    if (!isImage) {
      continue
    }
    const expiresOn = new Date()
    expiresOn.setDate(expiresOn.getDate() + 1000)
    const blobClient = containerClient.getBlobClient(blobName)
    const url = await blobClient.generateSasUrl({
      startsOn: new Date(),
      expiresOn: expiresOn,
      permissions: BlobSASPermissions.parse('racwd'),
      protocol: SASProtocol.HttpsAndHttp,
    })

    rawFiles.push({
      blobName: blobName,
      url: url,
      projectId: projectJson.id,
      orgId: projectJson.orgId.toString(),
      storedIn: 'azure',
    })
  }

  if (rawFiles.length === 0) {
    return []
  }

  const filesList = await FileService.dbCreateFilesFromCloud(rawFiles)
  return filesList
}
