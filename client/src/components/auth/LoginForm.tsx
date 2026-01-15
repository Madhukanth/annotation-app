import { FC, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { supabase } from '@renderer/lib/supabase'
import { useUserStore } from '@renderer/store/user.store'
import { errorNotification } from '@/components/ui/Notification'
import { useOrgStore } from '@renderer/store/organization.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Email or password is incorrect'
        errorNotification(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <form className="space-y-6" onSubmit={formik.handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          onChange={formik.handleChange}
          value={formik.values.email}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          onChange={formik.handleChange}
          value={formik.values.password}
          className="h-12"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}

export default LoginForm
