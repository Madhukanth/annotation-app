import { FC } from 'react'
import { cn } from '@/lib/utils'
import { useParams } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@renderer/constants'
import HeaderCore from '@/components/layout/HeaderCore'
import SidebarCore from '@/components/layout/SidebarCore'
import ProjectSidebar from '@/components/layout/ProjectSidebar'
import { Button } from '@/components/ui/button'

const HeaderLayout: FC<{ open: boolean; toggleOpen: () => void }> = ({ open, toggleOpen }) => {
  const { orgid: orgId, projectid: projectId } = useParams()

  return (
    <>
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <div className="flex h-full items-center px-4">
          {/* Logo area */}
          <div 
            className="flex items-center gap-3"
            style={{ width: `${SIDEBAR_WIDTH}px` }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleOpen}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-semibold text-lg text-primary">Labelwise</span>
          </div>

          <div className="flex-1" />

          <HeaderCore />
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-screen bg-card border-r transition-transform duration-200',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ 
          width: `${SIDEBAR_WIDTH}px`,
          paddingTop: `${HEADER_HEIGHT}px`
        }}
      >
        <div className="h-full overflow-y-auto py-4">
          {orgId && projectId ? (
            <ProjectSidebar orgId={orgId} projectId={projectId} closeMenu={toggleOpen} />
          ) : (
            <SidebarCore />
          )}
        </div>
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleOpen}
        />
      )}
    </>
  )
}

export default HeaderLayout
