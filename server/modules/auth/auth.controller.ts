import { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'

import { supabase, supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'
import * as AuthValidations from './auth.validation'
import * as OrganizationServices from '../organizations/organization.service'
import APIError from '../../errors/api-error'

/**
 * Register a new user
 * Creates user in Supabase Auth and profile in public.users
 */
export const registerUserController = async (
  req: Request<{}, {}, AuthValidations.RegisterUserBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, role, orgId } = req.body

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name, role },
      })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        throw new APIError('Email already exists', httpStatus.CONFLICT)
      }
      throw new APIError(authError.message, httpStatus.BAD_REQUEST)
    }

    const userId = authData.user.id

    // Create user profile in public.users
    const { error: profileError } = await supabaseAdmin
      .from(DB_TABLES.users)
      .insert({
        id: userId,
        name,
        email: email.toLowerCase(),
        role,
      })

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new APIError(
        'Failed to create user profile',
        httpStatus.INTERNAL_SERVER_ERROR
      )
    }

    // Note: User will be added to organization through project role assignment
    // No need for separate organization_users table

    return res.status(httpStatus.CREATED).send({
      id: userId,
      name,
      email: email.toLowerCase(),
      role,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Login user
 * Authenticates with Supabase Auth and returns session token
 */
export const loginUserController = async (
  req: Request<{}, {}, AuthValidations.LoginUserBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body

    // Sign in with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

    if (authError) {
      throw new APIError(
        'Email or password is incorrect',
        httpStatus.UNAUTHORIZED
      )
    }

    // Get user profile from public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from(DB_TABLES.users)
      .select('id, name, email, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      throw new APIError('User profile not found', httpStatus.NOT_FOUND)
    }

    // Get user's organizations
    const orgs = await OrganizationServices.dbGetOrganizations(profile.id)

    return res.status(httpStatus.OK).send({
      user: profile,
      token: authData.session.access_token,
      orgs,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Refresh token
 * Returns a new access token using the refresh token
 */
export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.body.refresh_token

    if (!refreshToken) {
      throw new APIError('Refresh token is required', httpStatus.BAD_REQUEST)
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      throw new APIError('Invalid refresh token', httpStatus.UNAUTHORIZED)
    }

    return res.status(httpStatus.OK).send({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Logout user
 * Signs out from Supabase Auth
 */
export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Sign out the user's session
      await supabase.auth.signOut()
    }

    return res.status(httpStatus.OK).send({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * Get current user
 * Returns the authenticated user's profile
 */
export const getCurrentUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new APIError('Not authenticated', httpStatus.UNAUTHORIZED)
    }

    // Get fresh user data from database
    const { data: profile, error } = await supabaseAdmin
      .from(DB_TABLES.users)
      .select('id, name, email, role')
      .eq('id', req.user.id)
      .single()

    if (error || !profile) {
      throw new APIError('User not found', httpStatus.NOT_FOUND)
    }

    // Get user's organizations
    const orgs = await OrganizationServices.dbGetOrganizations(profile.id)

    return res.status(httpStatus.OK).send({
      user: profile,
      orgs,
    })
  } catch (err) {
    next(err)
  }
}
