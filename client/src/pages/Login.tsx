import { FC } from 'react'

import LoginForm from '@renderer/components/LoginForm'
import AuthBackground from '@renderer/components/common/AuthBackground'

const Login: FC = () => {
  return (
    <AuthBackground>
      <div className="w-full">
        <p className="text-3xl">Login In To Your Account</p>
        <LoginForm />
      </div>
    </AuthBackground>
  )
}

export default Login
