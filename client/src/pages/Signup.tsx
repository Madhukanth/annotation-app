import { FC } from 'react'
import { Link } from 'react-router-dom'

import SignupForm from '@/components/auth/SignupForm'
import AuthBackground from '@/components/auth/AuthBackground'

const Signup: FC = () => {
  return (
    <AuthBackground>
      <div className="w-full">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create your account
        </h1>
        <p className="text-muted-foreground mb-8">
          Get started with your annotation workspace
        </p>
        
        <SignupForm />
        
        <p className="text-center mt-8 text-muted-foreground">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="text-primary font-medium hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthBackground>
  )
}

export default Signup
