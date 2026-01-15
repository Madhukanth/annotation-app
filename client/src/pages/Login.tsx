import { FC } from 'react'
import { Link } from 'react-router-dom'

import LoginForm from '@/components/auth/LoginForm'
import AuthBackground from '@/components/auth/AuthBackground'

const Login: FC = () => {
  return (
    <AuthBackground>
      <div className="w-full">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground mb-8">
          Sign in to your account to continue
        </p>
        
        <LoginForm />
        
        <p className="text-center mt-8 text-muted-foreground">
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className="text-primary font-medium hover:underline transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthBackground>
  )
}

export default Login
