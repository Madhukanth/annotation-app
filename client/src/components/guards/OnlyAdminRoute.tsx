import { useUserStore } from '@renderer/store/user.store'
import { FC, Fragment, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

type OnlyAdminRoutesProps = { children: ReactNode }
const OnlyAdminRoutes: FC<OnlyAdminRoutesProps> = ({ children }) => {
  const user = useUserStore((s) => s.user)

  const allowed = ['superadmin', 'orgadmin']

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/" />
  }

  return <Fragment>{children}</Fragment>
}

export default OnlyAdminRoutes
