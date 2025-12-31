import { FC } from 'react'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { loginUser, setAuthToken } from '@renderer/helpers/axiosRequests'
import { useUserStore } from '@renderer/store/user.store'
import { setUserInfoInCookie, setAuthTokenInCookie } from '@renderer/helpers/cookie'
import { errorNotification } from './common/Notification'
import { useOrgStore } from '@renderer/store/organization.store'

type LoginFormikType = {
  email: string
  password: string
}

const LoginForm: FC = () => {
  const navigate = useNavigate()

  const setOrgs = useOrgStore((s) => s.setOrgs)
  const setUser = useUserStore((s) => s.setUser)

  const { mutate, isLoading } = useMutation(loginUser, {
    async onSuccess(data) {
      if (data.orgs.length === 0) {
        errorNotification('User not related to any organization')
        return
      }

      setUser(data.user)
      setAuthToken(data.token)
      setUserInfoInCookie(data.user)
      setAuthTokenInCookie(data.token)
      setOrgs(data.orgs)
      navigate(`/orgs/${data.orgs[0]!.id}/projects`)
    },
    onError() {
      errorNotification('Email or password is incorrect')
    }
  })

  const formik = useFormik<LoginFormikType>({
    initialValues: { email: '', password: '' },
    onSubmit: (values) => {
      mutate(values)
    }
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
        Log in
      </button>
    </form>
  )
}

export default LoginForm
