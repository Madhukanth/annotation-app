/**
 * MongoDB to Supabase Migration Script
 *
 * This script migrates all data from MongoDB to Supabase PostgreSQL.
 * It preserves existing bcrypt password hashes and maps MongoDB ObjectIds to UUIDs.
 *
 * Usage:
 *   1. Set up your .env file with both MongoDB and Supabase credentials
 *   2. Run the PostgreSQL schema first (schema.sql)
 *   3. Run this script: npx ts-node supabase/migrate.ts
 */

import mongoose from 'mongoose'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'

dotenv.config()

// MongoDB Models - Import after mongoose is configured
import UserModel from '../modules/users/user.model'
import OrganizationModel from '../modules/organizations/organization.model'
import ProjectModel from '../modules/projects/project.model'
import FileModel from '../modules/files/file.model'
import ShapeModel from '../modules/shapes/shapes.model'
import AnnotationClassModel from '../modules/annotationclasses/annotationclasses.model'
import CommentModel from '../modules/comments/comments.model'
import CommentFileModel from '../modules/commentfiles/commentfiles.model'
import ActionModel from '../modules/action/action.model'
import InvitationModel from '../modules/invitations/invitation.model'

// ID Mappings: MongoDB ObjectId string -> Supabase UUID
interface IdMapping {
  [mongoId: string]: string
}

const idMappings: {
  users: IdMapping
  organizations: IdMapping
  projects: IdMapping
  files: IdMapping
  shapes: IdMapping
  annotationClasses: IdMapping
  comments: IdMapping
} = {
  users: {},
  organizations: {},
  projects: {},
  files: {},
  shapes: {},
  annotationClasses: {},
  comments: {},
}

// Statistics
const stats = {
  users: { total: 0, migrated: 0, failed: 0 },
  organizations: { total: 0, migrated: 0, failed: 0 },
  projects: { total: 0, migrated: 0, failed: 0 },
  annotationClasses: { total: 0, migrated: 0, failed: 0 },
  files: { total: 0, migrated: 0, failed: 0 },
  shapes: { total: 0, migrated: 0, failed: 0 },
  comments: { total: 0, migrated: 0, failed: 0 },
  commentFiles: { total: 0, migrated: 0, failed: 0 },
  actions: { total: 0, migrated: 0, failed: 0 },
  invitations: { total: 0, migrated: 0, failed: 0 },
}

async function connectMongoDB(): Promise<void> {
  const mongoUrl = process.env.DATABASE_URL
  if (!mongoUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  console.log('Connecting to MongoDB...')
  await mongoose.connect(mongoUrl)
  console.log('Connected to MongoDB')
}

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function migrateUsers(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Users ---')
  const users = await UserModel.find({})
  stats.users.total = users.length

  for (const user of users) {
    try {
      const mongoId = user._id.toString()

      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email.toLowerCase(),
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role,
            mongo_id: mongoId,
          },
        })

      if (authError) {
        console.error(`  Failed to create auth user ${user.email}:`, authError.message)
        stats.users.failed++
        continue
      }

      const userId = authData.user.id

      // Set the existing bcrypt password hash
      const { error: hashError } = await supabase.rpc('set_user_password_hash', {
        p_user_id: userId,
        p_password_hash: user.password,
      })

      if (hashError) {
        console.error(`  Failed to set password hash for ${user.email}:`, hashError.message)
      }

      // Insert user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: userId,
        name: user.name,
        email: user.email.toLowerCase(),
        role: user.role,
      })

      if (profileError) {
        console.error(`  Failed to create profile for ${user.email}:`, profileError.message)
        // Rollback auth user
        await supabase.auth.admin.deleteUser(userId)
        stats.users.failed++
        continue
      }

      // Store ID mapping
      idMappings.users[mongoId] = userId

      // Store mapping in database
      await supabase.from('migration_id_mapping').insert({
        collection_name: 'users',
        mongo_id: mongoId,
        supabase_uuid: userId,
      })

      stats.users.migrated++
      console.log(`  Migrated user: ${user.email}`)
    } catch (err) {
      console.error(`  Error migrating user ${user.email}:`, err)
      stats.users.failed++
    }
  }

  console.log(`Users: ${stats.users.migrated}/${stats.users.total} migrated, ${stats.users.failed} failed`)
}

async function migrateOrganizations(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Organizations ---')
  const orgs = await OrganizationModel.find({})
  stats.organizations.total = orgs.length

  for (const org of orgs) {
    try {
      const mongoId = org._id.toString()
      const newId = uuidv4()

      // Insert organization
      const { error: orgError } = await supabase.from('organizations').insert({
        id: newId,
        name: org.name,
        orgadmin_id: org.orgadmin ? idMappings.users[org.orgadmin.toString()] : null,
      })

      if (orgError) {
        console.error(`  Failed to create org ${org.name}:`, orgError.message)
        stats.organizations.failed++
        continue
      }

      idMappings.organizations[mongoId] = newId

      // Note: Organization-user relationships are now derived from project roles
      // Users will be linked to orgs when they are assigned to projects

      // Store mapping
      await supabase.from('migration_id_mapping').insert({
        collection_name: 'organizations',
        mongo_id: mongoId,
        supabase_uuid: newId,
      })

      stats.organizations.migrated++
      console.log(`  Migrated org: ${org.name}`)
    } catch (err) {
      console.error(`  Error migrating org ${org.name}:`, err)
      stats.organizations.failed++
    }
  }

  console.log(`Organizations: ${stats.organizations.migrated}/${stats.organizations.total} migrated`)
}

async function migrateProjects(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Projects ---')
  const projects = await ProjectModel.find({})
  stats.projects.total = projects.length

  for (const project of projects) {
    try {
      const mongoId = project._id.toString()
      const newId = uuidv4()
      const orgId = idMappings.organizations[project.orgId.toString()]

      if (!orgId) {
        console.error(`  Skipping project ${project.name}: org not found`)
        stats.projects.failed++
        continue
      }

      // Insert project (without default_class_id - will update later)
      const { error: projectError } = await supabase.from('projects').insert({
        id: newId,
        name: project.name,
        org_id: orgId,
        task_type: project.taskType,
        instructions: project.instructions || null,
        storage: project.storage,
        aws_secret_access_key: project.awsSecretAccessKey || null,
        aws_access_key_id: project.awsAccessKeyId || null,
        aws_region: project.awsRegion || null,
        aws_api_version: project.awsApiVersion || null,
        aws_bucket_name: project.awsBucketName || null,
        azure_storage_account: project.azureStorageAccount || null,
        azure_pass_key: project.azurePassKey || null,
        azure_container_name: project.azureContainerName || null,
        is_syncing: project.isSyncing || false,
        synced_at: project.syncedAt || null,
        prefix: project.prefix || null,
      })

      if (projectError) {
        console.error(`  Failed to create project ${project.name}:`, projectError.message)
        stats.projects.failed++
        continue
      }

      idMappings.projects[mongoId] = newId

      // Insert project role relationships
      const insertRoles = async (
        roleArray: any[],
        tableName: string
      ): Promise<void> => {
        const roles = (roleArray || [])
          .filter((id) => idMappings.users[id.toString()])
          .map((id) => ({
            project_id: newId,
            user_id: idMappings.users[id.toString()],
          }))

        if (roles.length > 0) {
          const { error } = await supabase.from(tableName).insert(roles)
          if (error) {
            console.error(`  Failed to add ${tableName} for ${project.name}:`, error.message)
          }
        }
      }

      await insertRoles(project.dataManagers, 'project_data_managers')
      await insertRoles(project.reviewers, 'project_reviewers')
      await insertRoles(project.annotators, 'project_annotators')

      // Store mapping
      await supabase.from('migration_id_mapping').insert({
        collection_name: 'projects',
        mongo_id: mongoId,
        supabase_uuid: newId,
      })

      stats.projects.migrated++
      console.log(`  Migrated project: ${project.name}`)
    } catch (err) {
      console.error(`  Error migrating project ${project.name}:`, err)
      stats.projects.failed++
    }
  }

  console.log(`Projects: ${stats.projects.migrated}/${stats.projects.total} migrated`)
}

async function migrateAnnotationClasses(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Annotation Classes ---')
  const classes = await AnnotationClassModel.find({})
  stats.annotationClasses.total = classes.length

  const batchSize = 500
  for (let i = 0; i < classes.length; i += batchSize) {
    const batch = classes.slice(i, i + batchSize)
    const insertData: any[] = []
    const mappings: any[] = []

    for (const cls of batch) {
      const mongoId = cls._id.toString()
      const orgId = idMappings.organizations[cls.orgId.toString()]
      const projectId = idMappings.projects[cls.projectId.toString()]

      if (!orgId || !projectId) {
        stats.annotationClasses.failed++
        continue
      }

      const newId = uuidv4()

      insertData.push({
        id: newId,
        name: cls.name,
        attributes: cls.attributes || [],
        has_text: cls.text || false,
        has_id: cls.ID || false,
        org_id: orgId,
        project_id: projectId,
        color: cls.color,
        notes: cls.notes || '',
      })

      idMappings.annotationClasses[mongoId] = newId

      mappings.push({
        collection_name: 'annotationClasses',
        mongo_id: mongoId,
        supabase_uuid: newId,
      })
    }

    if (insertData.length > 0) {
      const { error } = await supabase.from('annotation_classes').insert(insertData)
      if (error) {
        console.error(`  Batch insert failed:`, error.message)
        stats.annotationClasses.failed += insertData.length
      } else {
        stats.annotationClasses.migrated += insertData.length
        await supabase.from('migration_id_mapping').insert(mappings)
      }
    }

    console.log(`  Processed ${Math.min(i + batchSize, classes.length)}/${classes.length}`)
  }

  console.log(`Annotation Classes: ${stats.annotationClasses.migrated}/${stats.annotationClasses.total} migrated`)
}

async function updateProjectDefaultClasses(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Updating Project Default Classes ---')
  const projects = await ProjectModel.find({ defaultClassId: { $ne: null } })

  for (const project of projects) {
    if (project.defaultClassId) {
      const projectId = idMappings.projects[project._id.toString()]
      const classId = idMappings.annotationClasses[project.defaultClassId.toString()]

      if (projectId && classId) {
        await supabase
          .from('projects')
          .update({ default_class_id: classId })
          .eq('id', projectId)
      }
    }
  }

  console.log(`Updated ${projects.length} project default classes`)
}

async function migrateFiles(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Files ---')
  const totalFiles = await FileModel.countDocuments({})
  stats.files.total = totalFiles

  const batchSize = 500
  let processed = 0

  while (processed < totalFiles) {
    const files = await FileModel.find({}).skip(processed).limit(batchSize)
    const insertData: any[] = []
    const tagInserts: any[] = []
    const mappings: any[] = []

    for (const file of files) {
      const mongoId = file._id.toString()
      const orgId = idMappings.organizations[file.orgId.toString()]
      const projectId = idMappings.projects[file.projectId.toString()]

      if (!orgId || !projectId) {
        stats.files.failed++
        continue
      }

      const newId = uuidv4()

      insertData.push({
        id: newId,
        original_name: file.originalName,
        name: file.name,
        url: file.url,
        relative_path: file.relativePath,
        stored_in: file.storedIn || 'default',
        org_id: orgId,
        project_id: projectId,
        type: file.type,
        annotator_id: file.annotator ? idMappings.users[file.annotator.toString()] : null,
        assigned_at: file.assignedAt,
        complete: file.complete || false,
        total_frames: file.totalFrames || 1,
        fps: file.fps || 1,
        duration: file.duration || 0,
        has_shapes: file.hasShapes || false,
        annotated_at: file.annotatedAt,
        skipped: file.skipped || false,
        completed_at: file.completedAt,
        skipped_at: file.skippedAt,
        height: file.height,
        width: file.width,
      })

      idMappings.files[mongoId] = newId

      // Handle file tags
      if (file.tags && file.tags.length > 0) {
        for (const tagId of file.tags) {
          const classId = idMappings.annotationClasses[tagId.toString()]
          if (classId) {
            tagInserts.push({
              file_id: newId,
              annotation_class_id: classId,
            })
          }
        }
      }

      mappings.push({
        collection_name: 'files',
        mongo_id: mongoId,
        supabase_uuid: newId,
      })
    }

    if (insertData.length > 0) {
      const { error } = await supabase.from('files').insert(insertData)
      if (error) {
        console.error(`  Batch insert failed:`, error.message)
        stats.files.failed += insertData.length
      } else {
        stats.files.migrated += insertData.length

        if (tagInserts.length > 0) {
          await supabase.from('file_tags').insert(tagInserts)
        }

        await supabase.from('migration_id_mapping').insert(mappings)
      }
    }

    processed += files.length
    console.log(`  Processed ${processed}/${totalFiles} files`)
  }

  console.log(`Files: ${stats.files.migrated}/${stats.files.total} migrated`)
}

async function migrateShapes(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Shapes ---')
  const totalShapes = await ShapeModel.countDocuments({})
  stats.shapes.total = totalShapes

  const batchSize = 500
  let processed = 0

  while (processed < totalShapes) {
    const shapes = await ShapeModel.find({}).skip(processed).limit(batchSize)
    const insertData: any[] = []
    const mappings: any[] = []

    for (const shape of shapes) {
      const mongoId = shape._id.toString()
      const orgId = idMappings.organizations[shape.orgId.toString()]
      const projectId = idMappings.projects[shape.projectId.toString()]
      const fileId = idMappings.files[shape.fileId.toString()]

      if (!orgId || !projectId || !fileId) {
        stats.shapes.failed++
        continue
      }

      const newId = uuidv4()

      insertData.push({
        id: newId,
        name: shape.name,
        type: shape.type,
        notes: shape.notes || '',
        stroke: shape.stroke || 'red',
        stroke_width: shape.strokeWidth || 2,
        x: shape.x,
        y: shape.y,
        height: shape.height,
        width: shape.width,
        points: shape.points || null,
        org_id: orgId,
        project_id: projectId,
        file_id: fileId,
        class_id: shape.classId ? idMappings.annotationClasses[shape.classId.toString()] : null,
        text_field: shape.text,
        id_field: shape.ID,
        attribute: shape.attribute,
        at_frame: shape.atFrame || 1,
      })

      idMappings.shapes[mongoId] = newId

      mappings.push({
        collection_name: 'shapes',
        mongo_id: mongoId,
        supabase_uuid: newId,
      })
    }

    if (insertData.length > 0) {
      const { error } = await supabase.from('shapes').insert(insertData)
      if (error) {
        console.error(`  Batch insert failed:`, error.message)
        stats.shapes.failed += insertData.length
      } else {
        stats.shapes.migrated += insertData.length
        await supabase.from('migration_id_mapping').insert(mappings)
      }
    }

    processed += shapes.length
    console.log(`  Processed ${processed}/${totalShapes} shapes`)
  }

  console.log(`Shapes: ${stats.shapes.migrated}/${stats.shapes.total} migrated`)
}

async function migrateComments(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Comments ---')
  const comments = await CommentModel.find({})
  stats.comments.total = comments.length

  for (const comment of comments) {
    try {
      const mongoId = comment._id.toString()
      const userId = idMappings.users[comment.userId.toString()]
      const fileId = idMappings.files[comment.fileId.toString()]
      const projectId = idMappings.projects[comment.projectId.toString()]
      const orgId = idMappings.organizations[comment.orgId.toString()]

      if (!userId || !fileId || !projectId || !orgId) {
        stats.comments.failed++
        continue
      }

      const newId = uuidv4()

      const { error } = await supabase.from('comments').insert({
        id: newId,
        user_id: userId,
        file_id: fileId,
        project_id: projectId,
        org_id: orgId,
        shape_id: comment.shapeId ? idMappings.shapes[comment.shapeId] : null,
        content: comment.content,
      })

      if (error) {
        stats.comments.failed++
        continue
      }

      idMappings.comments[mongoId] = newId

      await supabase.from('migration_id_mapping').insert({
        collection_name: 'comments',
        mongo_id: mongoId,
        supabase_uuid: newId,
      })

      stats.comments.migrated++
    } catch (err) {
      stats.comments.failed++
    }
  }

  console.log(`Comments: ${stats.comments.migrated}/${stats.comments.total} migrated`)
}

async function migrateCommentFiles(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Comment Files ---')
  const commentFiles = await CommentFileModel.find({})
  stats.commentFiles.total = commentFiles.length

  const insertData = commentFiles
    .filter((cf) => {
      const fileId = idMappings.files[cf.fileId.toString()]
      const projectId = idMappings.projects[cf.projectId.toString()]
      const orgId = idMappings.organizations[cf.orgId.toString()]
      const commentId = idMappings.comments[cf.commentId.toString()]
      return fileId && projectId && orgId && commentId
    })
    .map((cf) => ({
      id: uuidv4(),
      name: cf.name,
      original_name: cf.originalName,
      stored_in: cf.storedIn || 'default',
      file_id: idMappings.files[cf.fileId.toString()],
      project_id: idMappings.projects[cf.projectId.toString()],
      org_id: idMappings.organizations[cf.orgId.toString()],
      comment_id: idMappings.comments[cf.commentId.toString()],
      url: cf.url,
      relative_url: cf.relativeUrl,
      type: cf.type,
    }))

  if (insertData.length > 0) {
    const { error } = await supabase.from('comment_files').insert(insertData)
    if (error) {
      console.error(`  Insert failed:`, error.message)
      stats.commentFiles.failed = insertData.length
    } else {
      stats.commentFiles.migrated = insertData.length
    }
  }

  console.log(`Comment Files: ${stats.commentFiles.migrated}/${stats.commentFiles.total} migrated`)
}

async function migrateActions(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Actions ---')
  const totalActions = await ActionModel.countDocuments({})
  stats.actions.total = totalActions

  const batchSize = 1000
  let processed = 0

  while (processed < totalActions) {
    const actions = await ActionModel.find({}).skip(processed).limit(batchSize)

    const insertData = actions
      .filter((action) => {
        const userId = idMappings.users[action.userId.toString()]
        const fileId = idMappings.files[action.fileId.toString()]
        const projectId = idMappings.projects[action.projectId.toString()]
        const orgId = idMappings.organizations[action.orgId.toString()]
        return userId && fileId && projectId && orgId
      })
      .map((action) => ({
        id: uuidv4(),
        name: action.name,
        user_id: idMappings.users[action.userId.toString()],
        file_id: idMappings.files[action.fileId.toString()],
        project_id: idMappings.projects[action.projectId.toString()],
        org_id: idMappings.organizations[action.orgId.toString()],
        shape_id: action.shapeId ? idMappings.shapes[action.shapeId.toString()] : null,
      }))

    if (insertData.length > 0) {
      const { error } = await supabase.from('actions').insert(insertData)
      if (error) {
        console.error(`  Batch insert failed:`, error.message)
        stats.actions.failed += insertData.length
      } else {
        stats.actions.migrated += insertData.length
      }
    }

    processed += actions.length
    console.log(`  Processed ${processed}/${totalActions} actions`)
  }

  console.log(`Actions: ${stats.actions.migrated}/${stats.actions.total} migrated`)
}

async function migrateInvitations(supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Invitations ---')
  const invitations = await InvitationModel.find({})
  stats.invitations.total = invitations.length

  const insertData = invitations
    .filter((inv) => {
      const projectId = idMappings.projects[inv.projectId.toString()]
      const inviterId = idMappings.users[inv.inviter.toString()]
      const inviteeId = idMappings.users[inv.invitee.toString()]
      return projectId && inviterId && inviteeId
    })
    .map((inv) => ({
      id: uuidv4(),
      project_id: idMappings.projects[inv.projectId.toString()],
      role: inv.role,
      inviter_id: idMappings.users[inv.inviter.toString()],
      invitee_id: idMappings.users[inv.invitee.toString()],
      status: inv.status,
    }))

  if (insertData.length > 0) {
    const { error } = await supabase.from('invitations').insert(insertData)
    if (error) {
      console.error(`  Insert failed:`, error.message)
      stats.invitations.failed = insertData.length
    } else {
      stats.invitations.migrated = insertData.length
    }
  }

  console.log(`Invitations: ${stats.invitations.migrated}/${stats.invitations.total} migrated`)
}

async function printSummary(): Promise<void> {
  console.log('\n========================================')
  console.log('MIGRATION SUMMARY')
  console.log('========================================')

  const entries = Object.entries(stats)
  for (const [name, data] of entries) {
    const success = data.migrated === data.total
    const icon = success ? '✓' : '✗'
    console.log(`${icon} ${name}: ${data.migrated}/${data.total} (${data.failed} failed)`)
  }

  const totalMigrated = entries.reduce((sum, [, d]) => sum + d.migrated, 0)
  const totalRecords = entries.reduce((sum, [, d]) => sum + d.total, 0)
  const totalFailed = entries.reduce((sum, [, d]) => sum + d.failed, 0)

  console.log('----------------------------------------')
  console.log(`TOTAL: ${totalMigrated}/${totalRecords} records migrated`)
  if (totalFailed > 0) {
    console.log(`WARNING: ${totalFailed} records failed to migrate`)
  }
  console.log('========================================')
}

async function main(): Promise<void> {
  console.log('========================================')
  console.log('MongoDB to Supabase Migration')
  console.log('========================================')

  try {
    await connectMongoDB()
    const supabase = createSupabaseClient()

    // Migration order matters due to foreign key dependencies
    await migrateUsers(supabase)
    await migrateOrganizations(supabase)
    await migrateProjects(supabase)
    await migrateAnnotationClasses(supabase)
    await updateProjectDefaultClasses(supabase)
    await migrateFiles(supabase)
    await migrateShapes(supabase)
    await migrateComments(supabase)
    await migrateCommentFiles(supabase)
    await migrateActions(supabase)
    await migrateInvitations(supabase)

    await printSummary()
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

main()
