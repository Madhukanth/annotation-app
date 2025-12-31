import { FC } from 'react'
import { TbLayoutDashboard } from 'react-icons/tb'
import { NavLink, useSearchParams } from 'react-router-dom'
import { MdOutlineIntegrationInstructions, MdOutlineKeyboardArrowLeft } from 'react-icons/md'
import { LuUsers } from 'react-icons/lu'
import { BsImages } from 'react-icons/bs'
import { MdPreview } from 'react-icons/md'
import { CgNotes } from 'react-icons/cg'
import { TfiStatsUp } from 'react-icons/tfi'

import { cn } from '@renderer/utils/cn'
import { useUserStore } from '@renderer/store/user.store'
import { useProjectStore } from '@renderer/store/project.store'

const getLinks = (orgId: string, projectId: string) => [
  {
    name: 'Dashboard',
    icon: <TbLayoutDashboard size={20} color="white" />,
    to: `/orgs/${orgId}/projects/${projectId}/dashboard`,
    access: []
  },
  {
    name: 'Instructions',
    icon: <MdOutlineIntegrationInstructions size={20} color="white" />,
    to: `/orgs/${orgId}/projects/${projectId}/instruction`,
    access: []
  },
  {
    name: 'Members',
    icon: <LuUsers size={20} color="white" />,
    to: `/orgs/${orgId}/projects/${projectId}/members`,
    access: ['admin']
  },
  {
    name: 'Images',
    icon: <BsImages size={20} color="white" />,
    to: `/orgs/${orgId}/projects/${projectId}/images`,
    access: ['admin', 'annotator']
  },
  {
    name: 'Review',
    icon: <MdPreview size={20} color="white" />,
    to: `/orgs/${orgId}/projects/${projectId}/review`,
    access: ['admin', 'reviewer']
  },
  {
    name: 'Classes',
    icon: <CgNotes size={20} color="white" />,
    to: `/orgs/${orgId}/projects/${projectId}/classes`,
    access: []
  },
  {
    name: 'Stats',
    icon: <TfiStatsUp size={20} color="white" />,
    to: `/orgs/${orgId}/projects/${projectId}/stats`,
    access: []
  }
]

const ProjectSidebar: FC<{ orgId: string; projectId: string; closeMenu: () => void }> = ({
  orgId,
  projectId,
  closeMenu
}) => {
  const [searchParams] = useSearchParams()
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const user = useUserStore((s) => s.user)
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)

  const isActive = (match: string) => {
    return location.pathname.includes(match)
  }

  const links = getLinks(orgId, projectId)

  let isAdmin = false
  let isReviewer = false
  let isAnnotator = false
  if (user && project) {
    isAdmin = project.dataManagers.includes(user.id)
    isReviewer = project.reviewers.includes(user.id)
    isAnnotator = project.annotators.includes(user.id)
  }

  return (
    <>
      <div className={cn('text-center px-2 pb-2')} onClick={closeMenu}>
        <NavLink to={`/orgs/${orgId}/projects`} className="flex gap-1 items-center">
          <MdOutlineKeyboardArrowLeft size={30} />
          Projects
        </NavLink>
      </div>

      <div className="px-2 py-2 mb-2">
        <div className="h-[2px] bg-white rounded"></div>
      </div>

      {links.map(({ name, icon, to, access }) => {
        let show = false
        if (access.length === 0) {
          show = true
        } else {
          if (isAdmin && access.includes('admin')) {
            show = true
          } else if (isReviewer && access.includes('reviewer')) {
            show = true
          } else if (isAnnotator && access.includes('annotator')) {
            show = true
          }
        }

        if (!show) return null

        return (
          <div
            key={to}
            className={cn('flex text-center px-2 py-3 border-l-4', {
              'border-brand': isActive(to),
              'border-transparent': !isActive(to)
            })}
            onClick={closeMenu}
          >
            <NavLink
              to={`${to}?projectSkip=${projectSkip}&projectLimit=${projectLimit}`}
              className="flex gap-3 items-center"
            >
              {icon}
              {name}
            </NavLink>
          </div>
        )
      })}
    </>
  )
}

export default ProjectSidebar
