import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import variables from '../../config/vars'

export function signJwt(payload: string | Buffer | object) {
  const EXPIRES_IN = '30d'
  return jwt.sign(payload, variables.JWT_SECRET!, { expiresIn: EXPIRES_IN })
}

export const verifyJWT = (token: string) => {
  return jwt.verify(token, variables.JWT_SECRET!, { ignoreExpiration: false })
}

export const hashPassword = async (password: string) => {
  const hash = await bcrypt.hash(password, 10)
  return hash
}

export const comparePassword = async (pass: string, hash: string) => {
  const match = await bcrypt.compare(pass, hash)
  return match
}
