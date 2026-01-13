import { Navigate } from 'react-router-dom'

import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import Loader from '@renderer/components/common/Loader'

const Home = () => {
  const user = useUserStore((s) => s.user)
  const orgs = useOrgStore((s) => s.orgs)
  const selectedOrg = useOrgStore((s) => s.selectedOrg)

  // If user is authenticated
  if (user) {
    // Use selectedOrg if available, otherwise first org
    const orgId = selectedOrg || orgs[0]?.id
    if (orgId) {
      return <Navigate to={`/orgs/${orgId}/projects`} replace />
    }
    // User is authenticated but has no orgs yet - show loader while orgs are being fetched
    return <Loader />
  }

  // Not authenticated - redirect to login
  return <Navigate to="/login" replace />
}

export default Home
