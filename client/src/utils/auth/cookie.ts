/**
 * Cookie Utilities
 * Authentication token management using cookies
 */

import Cookies from 'js-cookie'

const COOKIE_JWT_TOKEN = 'cookie_jwt_token'
const COOKIE_USER_INFO = 'cookie_user_info'

export interface CookieUserInfo {
  id: string
  name: string
  email: string
  role: string
}

export const setAuthTokenInCookie = (token: string) => {
  Cookies.set(COOKIE_JWT_TOKEN, token, { expires: 30 })
}

export const getAuthTokenFromCookie = () => {
  const token = Cookies.get(COOKIE_JWT_TOKEN)
  if (!token) return null
  return Cookies.get(COOKIE_JWT_TOKEN)
}

export const setUserInfoInCookie = (userInfo: CookieUserInfo) => {
  Cookies.set(COOKIE_USER_INFO, JSON.stringify(userInfo), { expires: 30 })
}

export const getUserInfoFromCookie = (): CookieUserInfo | null => {
  const userInfoStr = Cookies.get(COOKIE_USER_INFO)
  if (!userInfoStr) return null
  return JSON.parse(userInfoStr)
}

export function clearAuthTokenFromCookie() {
  Cookies.remove(COOKIE_JWT_TOKEN)
  Cookies.remove(COOKIE_USER_INFO)
}
