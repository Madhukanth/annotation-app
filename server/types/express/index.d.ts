import { Express, Request } from 'express'

import { UserSafeInfoType } from '../../modules/users/user.utils'

declare global {
  namespace Express {
    interface User extends UserSafeInfoType {}
  }
}
