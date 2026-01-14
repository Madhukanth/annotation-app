import { FC, ReactNode } from 'react'

type HoverTextProps = { children: ReactNode }
const HoverText: FC<HoverTextProps> = ({ children }) => {
  return <p className="bg-black text-white ml-1 p-2 rounded text-sm">{children}</p>
}

export default HoverText
