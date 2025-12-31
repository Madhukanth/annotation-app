import { FC } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

import {
  createInstructionFileUploadUrl,
  fetchProjectById,
  updateProject,
  uploadProjectInstructionFile
} from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import UploadAdapter from './UploadAdapter'

const ProjectInstructions: FC = () => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const currentUser = useUserStore((s) => s.user)

  const { data: projectData, isFetching } = useQuery(
    ['project-id', { orgId: orgId!, projectId: projectId! }],
    fetchProjectById,
    {
      enabled: !!orgId && !!projectId,
      initialData: null
    }
  )
  const { mutate: updateProjectMutate } = useMutation(updateProject)
  const { mutateAsync: createUploadUrlMutate } = useMutation(createInstructionFileUploadUrl)
  const { mutateAsync: uploadProjectInstFile } = useMutation(uploadProjectInstructionFile)

  const handleEditorChange = (editorState: string) => {
    if (!orgId || !projectId) return
    updateProjectMutate({ orgId, projectId, instructions: editorState })
  }

  if (isFetching) {
    return <div></div>
  }

  let editable = true
  if (currentUser && projectData) {
    editable = !projectData.annotators.includes(currentUser.id)
  }

  function uploadPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
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
        editor={ClassicEditor}
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
