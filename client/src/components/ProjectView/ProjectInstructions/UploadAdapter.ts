import { FileLoader, UploadResponse } from '@ckeditor/ckeditor5-upload'
import { UseMutateAsyncFunction } from '@tanstack/react-query'

import { getStoredUrl } from '@renderer/utils/vars'
import { Storage } from '@models/Project.model'

class UploadAdapter {
  constructor(
    private loader: FileLoader,
    private orgId: string | null,
    private projectId: string | null,
    private createUploadUrlMutateAsync: UseMutateAsyncFunction<
      { uploadUrl: string; relativePath: string; name: string; fileId: string; getUrl: string },
      unknown,
      { orgId: string; projectId: string; originalName: string; type: string }
    >,
    private uploadFileMutateAsync: UseMutateAsyncFunction<
      string,
      unknown,
      {
        orgId: string
        projectId: string
        url: string
        uploadFile: File
        storage: Storage
        fileId: string
      }
    >,
    private storage: Storage
  ) {}

  async upload(): Promise<UploadResponse> {
    const file = await this.loader.file
    if (!file) {
      throw new Error('File not found')
    }

    if (!this.orgId || !this.projectId) {
      throw new Error('orgId or projectId not found')
    }

    const formData = new FormData()
    formData.append('file', file)

    const createUrlData = await this.createUploadUrlMutateAsync({
      orgId: this.orgId,
      projectId: this.projectId,
      originalName: file.name,
      type: file.type
    })

    await this.uploadFileMutateAsync({
      orgId: this.orgId,
      projectId: this.projectId,
      fileId: createUrlData.fileId,
      url: createUrlData.uploadUrl,
      uploadFile: file,
      storage: this.storage
    })

    return { default: getStoredUrl(createUrlData.getUrl, this.storage) }
  }
}

export default UploadAdapter
