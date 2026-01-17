import { FC, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'

import { supabase } from '@renderer/lib/supabase'
import { useUserStore } from '@renderer/store/user.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { errorNotification, successNotification } from '@renderer/components/common/Notification'

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
      } catch (error: any) {
        errorNotification(error.message || 'Signup failed')
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <form className="flex flex-col pt-8" onSubmit={formik.handleSubmit}>
      <label className="text-gray-400" htmlFor="name">
        Full Name
      </label>
      <input
        className="p-2 text-lg border-b border-b-gray-300"
        required
        id="name"
        name="name"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.name}
      />
      {formik.touched.name && formik.errors.name && (
        <span className="text-red-500 text-sm mt-1">{formik.errors.name}</span>
      )}

      <label className="text-gray-400 mt-4" htmlFor="email">
        Email Address
      </label>
      <input
        className="p-2 text-lg border-b border-b-gray-300"
        required
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.email}
      />
      {formik.touched.email && formik.errors.email && (
        <span className="text-red-500 text-sm mt-1">{formik.errors.email}</span>
      )}

      <label className="text-gray-400 mt-4" htmlFor="password">
        Password
      </label>
      <input
        required
        className="p-2 text-lg border-b border-b-gray-300"
        id="password"
        name="password"
        type="password"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.password}
      />
      {formik.touched.password && formik.errors.password && (
        <span className="text-red-500 text-sm mt-1">
          {formik.errors.password}
        </span>
      )}

      <label className="text-gray-400 mt-4" htmlFor="confirmPassword">
        Confirm Password
      </label>
      <input
        required
        className="p-2 text-lg border-b border-b-gray-300"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.confirmPassword}
      />
      {formik.touched.confirmPassword && formik.errors.confirmPassword && (
        <span className="text-red-500 text-sm mt-1">
          {formik.errors.confirmPassword}
        </span>
      )}

      <label className="text-gray-400 mt-4" htmlFor="organizationName">
        Organization Name
      </label>
      <input
        required
        className="p-2 text-lg border-b border-b-gray-300"
        id="organizationName"
        name="organizationName"
        type="text"
        placeholder="Your company or team name"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.organizationName}
      />
      {formik.touched.organizationName && formik.errors.organizationName && (
        <span className="text-red-500 text-sm mt-1">
          {formik.errors.organizationName}
        </span>
      )}

      <button
        disabled={isLoading}
        className="w-full mt-8 bg-brand text-white text-xl p-4 rounded-md disabled:opacity-50"
        type="submit"
      >
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}

export default SignupForm
