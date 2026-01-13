import type { FileWithMetadata } from '@/services/supabase/files.service'
import type { ProjectListItem } from '@/services/supabase/projects.service'
import type FileType from '@renderer/models/File.model'
import type ProjectType from '@models/Project.model'

// Transform a single shape from Supabase snake_case to camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformShape = (shape: any) => ({
  id: shape.id,
  name: shape.name,
  type: shape.type,
  notes: shape.notes,
  stroke: shape.stroke,
  strokeWidth: shape.stroke_width,
  x: shape.x,
  y: shape.y,
  height: shape.height,
  width: shape.width,
  points: shape.points,
  classId: shape.class_id,
  text: shape.text_field,
  ID: shape.id_field,
  attribute: shape.attribute,
  atFrame: shape.at_frame,
  orgId: shape.org_id,
  projectId: shape.project_id,
  fileId: shape.file_id,
  closed: shape.closed ?? false
})

// Transform video shapes (organized by frame) to legacy format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformVideoShapes = (frameShapes: { [frame: number]: unknown[] }): { [frame: number]: any[] } => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: { [frame: number]: any[] } = {}
  for (const [frame, shapes] of Object.entries(frameShapes)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[Number(frame)] = (shapes as any[]).map(transformShape)
  }
  return result
}

// Transform metadata from Supabase format to legacy format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformMetadata = (file: FileWithMetadata): any => {
  if (!file.metadata) {
    return {
      rectangles: [],
      circles: [],
      polygons: [],
      faces: [],
      lines: []
    }
  }

  // For images, metadata contains arrays of shapes
  // For videos, metadata contains objects with frame keys
  if (file.type === 'image') {
    const meta = file.metadata as {
      rectangles: unknown[]
      circles: unknown[]
      polygons: unknown[]
      faces: unknown[]
      lines: unknown[]
    }
    return {
      rectangles: (meta.rectangles || []).map(transformShape),
      circles: (meta.circles || []).map(transformShape),
      polygons: (meta.polygons || []).map(transformShape),
      faces: (meta.faces || []).map(transformShape),
      lines: (meta.lines || []).map(transformShape)
    }
  } else {
    // Video metadata has shapes organized by frame
    const meta = file.metadata as {
      rectangles: { [frame: number]: unknown[] }
      circles: { [frame: number]: unknown[] }
      polygons: { [frame: number]: unknown[] }
      faces: { [frame: number]: unknown[] }
      lines: { [frame: number]: unknown[] }
    }
    return {
      rectangles: transformVideoShapes(meta.rectangles || {}),
      circles: transformVideoShapes(meta.circles || {}),
      polygons: transformVideoShapes(meta.polygons || {}),
      faces: transformVideoShapes(meta.faces || {}),
      lines: transformVideoShapes(meta.lines || {})
    }
  }
}

// Transform Supabase file to legacy FileType format
export function transformFileToLegacy(file: FileWithMetadata): FileType {
  return {
    id: file.id,
    originalName: file.original_name || '',
    relativePath: file.relative_path || '',
    name: file.name || '',
    orgId: file.org_id,
    projectId: file.project_id,
    url: file.url || '',
    type: (file.type || 'image') as 'image' | 'video',
    metadata: transformMetadata(file),
    annotators: file.annotator_id ? [file.annotator_id] : [],
    reviewers: [],
    createdAt: file.created_at || '',
    complete: file.complete,
    stageScale: 1,
    storedIn: file.stored_in,
    tags: (file.tags || []).map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      attributes: [],
      text: false,
      ID: false,
      orgId: file.org_id,
      projectId: file.project_id,
      notes: '',
      createdAt: '',
      modifiedAt: ''
    })),
    dbIndex: file.dbIndex || 0,
    skipped: file.skipped,
    fps: file.fps,
    totalFrames: file.total_frames,
    duration: file.duration
  }
}

// Transform Supabase project to legacy ProjectType format
export function transformProjectToLegacy(project: ProjectListItem): ProjectType {
  return {
    id: project.id,
    name: project.name,
    orgId: project.org_id,
    dataManagers: project.dataManagerIds,
    reviewers: [],
    annotators: [],
    instructions: project.instructions || '',
    createdAt: project.created_at || '',
    modifiedAt: project.updated_at || '',
    thumbnail: '',
    storage: project.storage,
    taskType: project.task_type,
    defaultClassId: project.default_class_id || null,
    isSyncing: project.is_syncing,
    syncedAt: project.synced_at ? new Date(project.synced_at) : new Date()
  }
}
