import { FC, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { supabase } from '@renderer/lib/supabase'
import { useUserStore } from '@renderer/store/user.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { errorNotification, successNotification } from '@/components/ui/Notification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SignupFormikType = {
  name: string
  email: string
  password: string
  confirmPassword: string
  organizationName: string
}

const SignupForm: FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const setOrgs = useOrgStore((s) => s.setOrgs)
  const setUser = useUserStore((s) => s.setUser)

  const formik = useFormik<SignupFormikType>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
    },
    validate: (values) => {
      const errors: Partial<SignupFormikType> = {}

      if (!values.name) {
        errors.name = 'Name is required'
      }

      if (!values.email) {
        errors.email = 'Email is required'
      }

      if (!values.password) {
        errors.password = 'Password is required'
      } else if (values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      }

      if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }

      if (!values.organizationName) {
        errors.organizationName = 'Organization name is required'
      }

      return errors
    },
    onSubmit: async (values) => {
      setIsLoading(true)

      try {
        // 1. Sign up with Supabase Auth - pass all data in metadata
        // The database trigger will handle creating user and org (user becomes orgadmin)
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: values.email.toLowerCase(),
            password: values.password,
            options: {
              data: {
                name: values.name,
                organization_name: values.organizationName,
              },
            },
          }
        )

        if (authError) {
          throw authError
        }

        if (!authData.user) {
          throw new Error('Signup failed')
        }

        // 2. Wait for trigger to complete all operations
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // 3. Fetch the created organization (user is the org admin)
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('orgadmin_id', authData.user.id)
          .single()

        if (orgError || !org) {
          throw new Error('Failed to fetch organization')
        }

        // 4. Set user and orgs in store
        setUser({
          id: authData.user.id,
          name: values.name,
          email: values.email.toLowerCase(),
          role: 'orgadmin',
        })
        setOrgs([{ id: org.id, name: org.name }])

        successNotification('Account created successfully!')
        navigate(`/orgs/${org.id}/projects`)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Signup failed'
        errorNotification(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">
          Full Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          required
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.name}
          className="h-11"
        />
        {formik.touched.name && formik.errors.name && (
          <span className="text-destructive text-sm">{formik.errors.name}</span>
        )}
      </div>

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
          onBlur={formik.handleBlur}
          value={formik.values.email}
          className="h-11"
        />
        {formik.touched.email && formik.errors.email && (
          <span className="text-destructive text-sm">{formik.errors.email}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          required
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password}
          className="h-11"
        />
        {formik.touched.password && formik.errors.password && (
          <span className="text-destructive text-sm">{formik.errors.password}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-foreground">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          required
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.confirmPassword}
          className="h-11"
        />
        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
          <span className="text-destructive text-sm">{formik.errors.confirmPassword}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizationName" className="text-foreground">
          Organization Name
        </Label>
        <Input
          id="organizationName"
          name="organizationName"
          type="text"
          placeholder="Your company or team name"
          required
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.organizationName}
          className="h-11"
        />
        {formik.touched.organizationName && formik.errors.organizationName && (
          <span className="text-destructive text-sm">{formik.errors.organizationName}</span>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 text-base font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  )
}

export default SignupForm
