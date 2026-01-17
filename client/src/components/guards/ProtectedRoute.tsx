import { useUserStore } from '@renderer/store/user.store'
import { FC, Fragment, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

type ProtectedRoutesProps = { children: ReactNode }

const ProtectedRoutes: FC<ProtectedRoutesProps> = ({ children }) => {
  const user = useUserStore((s) => s.user)

  // Auth is already initialized in App.tsx, so we just check user state
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Fragment>{children}</Fragment>
}

export default ProtectedRoutes
