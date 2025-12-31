import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { getAuthTokenFromCookie } from '@renderer/helpers/cookie'
import { useOrgStore } from '@renderer/store/organization.store'
import Loader from '@renderer/components/common/Loader'

const Home = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null)
  const orgs = useOrgStore((s) => s.orgs)

  const checkAuth = useCallback(async () => {
    const token = getAuthTokenFromCookie()
    if (token) {
      setIsAuth(true)
    } else {
      setIsAuth(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isAuth === null) return <Loader />

  if (isAuth) {
    return <Navigate to={`/orgs/${orgs[0]?.id}/projects`} />
  }

  return <Navigate to="login" />
}

export default Home
