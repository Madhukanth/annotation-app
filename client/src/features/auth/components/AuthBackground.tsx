import { FC, ReactNode } from 'react'

import dotTexture from '@/assets/ic_dot-texture.svg'

const LoginFormWidth = 500

type AuthBackgroundProps = { children: ReactNode }
const AuthBackground: FC<AuthBackgroundProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-screen">
      <div className="flex items-center justify-center h-screen bg-brand">
        <div
          style={{ width: `calc(100vw - ${LoginFormWidth}px)` }}
          className="hidden sm:block relative"
        >
          <div className="px-7 flex flex-col justify-center items-start group sm:mt-2 md:mt-2 lg:mt-2 xl:mt-2 2xl:mt-2"></div>
          <div className="flex justify-between p-10">
            <div className="w-auto">
              <img src={dotTexture} alt="dots1" className="mt-60 pr-50 mx-auto" />
            </div>
            <div className="w-auto">
              <img src={dotTexture} alt="dots1" className="mx-auto" />
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex items-center justify-center mx-auto p-14"
        style={{ width: `${LoginFormWidth}px` }}
      >
        <div className="block sm:hidden"></div>
        {children}
        <div className="absolute bottom-10 text-gray-400">
          <p>&copy;2024 All Rights Reserved. Labelwise&reg; Ltd.</p>
        </div>
      </div>
    </div>
  )
}

export default AuthBackground
