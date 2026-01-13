import { Handler } from 'express'
import httpStatus from 'http-status'

import { supabase, supabaseAdmin } from '../config/supabase'
import { DB_TABLES } from '../config/vars'
import APIError from '../errors/api-error'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        role: 'superadmin' | 'orgadmin' | 'user'
      }
    }
  }
}

export type UserType = {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'orgadmin' | 'user'
}

/**
 * Authorize middleware - validates Supabase JWT token
 * Replaces passport.authenticate('jwt', { session: false })
 */
export const authorize: Handler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError('No token provided', httpStatus.UNAUTHORIZED)
    }

    const token = authHeader.split(' ')[1]

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new APIError('Invalid or expired token', httpStatus.UNAUTHORIZED)
    }

    // Get user profile from public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from(DB_TABLES.users)
      .select('id, name, email, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new APIError('User profile not found', httpStatus.UNAUTHORIZED)
    }

    // Attach user to request
    req.user = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware to check if user is a data manager of the project
 */
export const onlyDataManagers: Handler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    const userId = req.user.id
    const projectId = req.params.projectid

    if (!projectId) {
      throw new APIError('ProjectId not found', httpStatus.NOT_FOUND)
    }

    // Check if user is a data manager of this project
    const { data: membership, error } = await supabaseAdmin
      .from(DB_TABLES.projectDataManagers)
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (error || !membership) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware to check if user is a data manager or reviewer of the project
 */
export const onlyDataManagersAndReviewers: Handler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    const userId = req.user.id
    const projectId = req.params.projectid

    if (!projectId) {
      throw new APIError('ProjectId not found', httpStatus.NOT_FOUND)
    }

    // Check data managers
    const { data: dmMembership } = await supabaseAdmin
      .from(DB_TABLES.projectDataManagers)
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (dmMembership) {
      return next()
    }

    // Check reviewers
    const { data: reviewerMembership } = await supabaseAdmin
      .from(DB_TABLES.projectReviewers)
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (reviewerMembership) {
      return next()
    }

    throw new APIError('Access denied', httpStatus.FORBIDDEN)
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware to check if user is a superadmin
 */
export const onlySuperAdmin: Handler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'superadmin') {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware to check if user is a superadmin or orgadmin
 */
export const onlyAdmins: Handler = async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'orgadmin')) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware to check if user is a member of the project (any role)
 */
export const onlyProjectMembers: Handler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new APIError('Access denied', httpStatus.FORBIDDEN)
    }

    const userId = req.user.id
    const projectId = req.params.projectid

    if (!projectId) {
      throw new APIError('ProjectId not found', httpStatus.NOT_FOUND)
    }

    // Check all project roles
    const [dmResult, reviewerResult, annotatorResult] = await Promise.all([
      supabaseAdmin
        .from(DB_TABLES.projectDataManagers)
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single(),
      supabaseAdmin
        .from(DB_TABLES.projectReviewers)
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single(),
      supabaseAdmin
        .from(DB_TABLES.projectAnnotators)
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single(),
    ])

    if (dmResult.data || reviewerResult.data || annotatorResult.data) {
      return next()
    }

    throw new APIError('Access denied', httpStatus.FORBIDDEN)
  } catch (error) {
    next(error)
  }
}
