import { FC } from 'react'
import { Link } from 'react-router-dom'

import LoginForm from '@/components/auth/LoginForm'
import AuthBackground from '@/components/auth/AuthBackground'

const Login: FC = () => {
  return (
    <AuthBackground>
      <div className="w-full">
        <p className="text-3xl">Log In To Your Account</p>
        <LoginForm />
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthBackground>
  )
}

export default Login
