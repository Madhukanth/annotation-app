import { FC } from 'react'
import { Link } from 'react-router-dom'

import SignupForm from '@/components/auth/SignupForm'
import AuthBackground from '@/components/auth/AuthBackground'

const Signup: FC = () => {
  return (
    <AuthBackground>
      <div className="w-full">
        <p className="text-3xl">Create Your Account</p>
        <SignupForm />
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthBackground>
  )
}

export default Signup
