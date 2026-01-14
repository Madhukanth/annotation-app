import { FC } from 'react'
import { cn } from '@renderer/utils/cn'
import { useParams } from 'react-router-dom'

import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@renderer/constants'
import HeaderCore from '@/components/layout/HeaderCore'
import SidebarCore from '@/components/layout/SidebarCore'
import ProjectSidebar from '@/components/layout/ProjectSidebar'
import { IoClose } from 'react-icons/io5'
import { HiMenu } from 'react-icons/hi'

const HeaderLayout: FC<{ open: boolean; toggleOpen: () => void }> = ({ open, toggleOpen }) => {
  const { orgid: orgId, projectid: projectId } = useParams()

  return (
    <>
      <nav className="bg-white">
        <div className="flex flex-row">
          <div
            style={{ height: `${HEADER_HEIGHT}px`, width: `${SIDEBAR_WIDTH}px` }}
            className="flex justify-between items-center px-2"
          >
            <button className="block lg:hidden" onClick={toggleOpen}>
              {open ? <IoClose size={25} /> : <HiMenu size={25} />}
            </button>
          </div>

          <div className="flex-grow"></div>

          <HeaderCore />
        </div>
      </nav>
      <div
        className={cn('fixed top-15 h-screen bg-brand1 text-white z-50 pt-4 lg:block', {
          hidden: !open,
          block: open
        })}
        style={{ width: `${SIDEBAR_WIDTH}px` }}
      >
        {orgId && projectId ? (
          <ProjectSidebar orgId={orgId} projectId={projectId} closeMenu={toggleOpen} />
        ) : (
          <SidebarCore />
        )}
      </div>
    </>
  )
}

export default HeaderLayout
