import { FC, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'

import { supabase } from '@renderer/lib/supabase'
import { useUserStore } from '@renderer/store/user.store'
import { errorNotification } from '@/components/ui/Notification'
import { useOrgStore } from '@renderer/store/organization.store'

type LoginFormikType = {
  email: string
  password: string
}

const LoginForm: FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const setOrgs = useOrgStore((s) => s.setOrgs)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)
  const setUser = useUserStore((s) => s.setUser)

  const formik = useFormik<LoginFormikType>({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      setIsLoading(true)

      try {
        // Sign in with Supabase Auth
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: values.email.toLowerCase(),
            password: values.password,
          })

        if (authError) {
          throw authError
        }

        // Get user profile from public.users
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profile) {
          throw new Error('User profile not found')
        }

        // Get user's organizations (via project membership or org admin)
        // First check if user is org admin
        const { data: adminOrgs } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('orgadmin_id', authData.user.id)

        // Then get orgs via project membership
        const { data: projectOrgs } = await supabase.rpc(
          'get_user_organizations_via_projects',
          { p_user_id: authData.user.id }
        )

        // Combine and dedupe results
        const orgsMap = new Map<string, { id: string; name: string }>()
        if (adminOrgs) {
          adminOrgs.forEach((org) => orgsMap.set(org.id, org))
        }
        if (projectOrgs) {
          projectOrgs.forEach((org: { id: string; name: string }) => {
            if (!orgsMap.has(org.id)) {
              orgsMap.set(org.id, { id: org.id, name: org.name })
            }
          })
        }

        const orgs = Array.from(orgsMap.values())

        if (orgs.length === 0) {
          errorNotification('User not related to any organization')
          return
        }

        setUser(profile)
        setOrgs(orgs)
        setSelectedOrg(orgs[0].id)
        navigate(`/orgs/${orgs[0].id}/projects`)
      } catch (error: any) {
        errorNotification(error.message || 'Email or password is incorrect')
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <form className="flex flex-col pt-12" onSubmit={formik.handleSubmit}>
      <label className="text-gray-400" htmlFor="email">
        Email Address
      </label>
      <input
        className="p-2 text-lg border-b border-b-gray-300"
        required
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        value={formik.values.email}
      />

      <label className="text-gray-400 mt-6" htmlFor="password">
        Password
      </label>
      <input
        required
        className="p-2 text-lg border-b border-b-gray-300"
        id="password"
        name="password"
        type="password"
        onChange={formik.handleChange}
        value={formik.values.password}
      />
      <button
        disabled={isLoading}
        className="w-full mt-8 bg-brand text-white text-xl p-4 rounded-md disabled:opacity-50"
        type="submit"
      >
        {isLoading ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  )
}

export default LoginForm
