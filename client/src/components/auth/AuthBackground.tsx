import { FC, ReactNode } from 'react'

type AuthBackgroundProps = { children: ReactNode }

const AuthBackground: FC<AuthBackgroundProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Gradient background with animated elements */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/80 to-primary/60 overflow-hidden">
        {/* Animated floating orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-4">
            Labelwise
          </h1>
          <p className="text-xl text-white/80 max-w-md leading-relaxed">
            Professional annotation platform for image and video datasets. 
            Streamline your labeling workflow with precision tools.
          </p>
          
          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>Image & Video Annotation</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>Team Collaboration</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>Project Management</span>
            </div>
          </div>
        </div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
          
          {/* Footer */}
          <p className="mt-12 text-center text-sm text-muted-foreground">
            ©2024 All Rights Reserved. Labelwise® Ltd.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthBackground
