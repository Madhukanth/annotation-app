import { FC, useState, useRef, useEffect } from 'react'
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

  // Local state for editor content to prevent re-renders on every keystroke
  const [editorContent, setEditorContent] = useState<string>('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize editor content when project data loads
  useEffect(() => {
    if (projectData?.instructions && !isInitializedRef.current) {
      setEditorContent(projectData.instructions)
      isInitializedRef.current = true
    }
  }, [projectData?.instructions])

  const handleEditorChange = (editorState: string) => {
    setEditorContent(editorState)
    
    // Debounce the save operation
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      if (!projectId) return
      updateProjectMutate({ projectId, input: { instructions: editorState } })
    }, 1000) // Save after 1 second of no typing
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  if (isFetching && !isInitializedRef.current) {
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
        data={editorContent}
        onChange={(_event, editor) => {
          const data = editor.getData()
          handleEditorChange(data)
        }}
      />
    </div>
  )
}

export default ProjectInstructions

