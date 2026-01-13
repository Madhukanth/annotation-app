import { FC } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

import {
  createInstructionFileUploadUrl,
  uploadProjectInstructionFile
} from '@renderer/helpers/axiosRequests'
import { useProject, useUpdateProject } from '@/hooks/useProjects'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import UploadAdapter from './UploadAdapter'

const ProjectInstructions: FC = () => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const currentUser = useUserStore((s) => s.user)

  const { data: projectData, isFetching } = useProject(projectId || '')
  const { mutate: updateProjectMutate } = useUpdateProject()
  const { mutateAsync: createUploadUrlMutate } = useMutation(createInstructionFileUploadUrl)
  const { mutateAsync: uploadProjectInstFile } = useMutation(uploadProjectInstructionFile)

  const handleEditorChange = (editorState: string) => {
    if (!projectId) return
    updateProjectMutate({ projectId, input: { instructions: editorState } })
  }

  if (isFetching) {
    return <div></div>
  }

  let editable = true
  if (currentUser && projectData && projectData.annotators) {
    editable = !projectData.annotators.some((a) => a.id === currentUser.id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function uploadPlugin(editor: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new UploadAdapter(
        loader,
        orgId || null,
        projectId || null,
        createUploadUrlMutate,
        uploadProjectInstFile,
        projectData?.storage || 'default'
      )
    }
  }

  return (
    <div className="h-full overflow-scroll">
      <p className="text-xl mb-3">Instruction</p>
      <CKEditor
        disabled={!editable}
        config={{ extraPlugins: [uploadPlugin] }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor={ClassicEditor as any}
        data={projectData?.instructions || ''}
        onChange={(_event, editor) => {
          const data = editor.getData()
          handleEditorChange(data)
        }}
      />
    </div>
  )
}

export default ProjectInstructions
