import { FC, useEffect, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { HiMenu } from 'react-icons/hi'
import { BsInfoLg } from 'react-icons/bs'
import ReactSwitch from 'react-switch'
import { BsFillGrid3X3GapFill } from 'react-icons/bs'
import { BiCheck, BiX } from 'react-icons/bi'

import { cn } from '@renderer/utils/cn'
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@renderer/constants'
import { useOrganizations } from '@/hooks/useOrganizations'
import { useUserStore } from '@renderer/store/user.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { useClassesStore } from '@renderer/store/classes.store'
import HeaderCore from '@renderer/components/Header/HeaderCore'
import SidebarCore from '@renderer/components/Sidebar/SidebarCore'
import Tooltip from '../common/Tooltip'
import HoverText from '../common/HoverText'
import FileInfo from './FileInfo'
import SkipButton from './SkipButton'
import CompleteButton from './CompleteButton'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useProjectStore } from '@renderer/store/project.store'
import { useClassifyStore } from '@renderer/store/classify.store'
import CustomSelect from '../common/Select'
import { useFilesStore } from '@renderer/store/files.store'

const gridOptions = [
  { label: '2 x 2', value: '4' },
  { label: '3 x 2', value: '6' },
  { label: '3 x 3', value: '9' },
  { label: '4 x 4', value: '16' },
  { label: '5 x 5', value: '25' }
]

const HeaderLayout: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { orgid: orgId, projectid: projectId } = useParams()
  const { user } = useUserStore()
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)
  const setOrgs = useOrgStore((s) => s.setOrgs)
  const projects = useProjectStore((s) => s.projects)
  const currentProject = projects.find((p) => p.id === projectId)
  const isClassificationProject = currentProject?.taskType === 'classification'

  const [searchParams] = useSearchParams()
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const setSelectedTagIds = useClassesStore((state) => state.setSelectedTagIds)
  const [showInfo, setShowInfo] = useState(false)
  const selectedFile = useFilesStore((s) => s.selectedFile)
  const isGrid = useClassifyStore((s) => s.isGrid)
  const setIsGrid = useClassifyStore((s) => s.setIsGrid)
  const gridSize = useClassifyStore((s) => s.gridSize)
  const setGridSize = useClassifyStore((s) => s.setGridSize)

  const { data: organizations = [] } = useOrganizations(user?.id || '')

  useEffect(() => {
    setOrgs(organizations)

    if (organizations.length === 0) {
      setSelectedOrg(null)
      setSelectedTagIds([])
      return
    }

    const firstOrgId = organizations[0].id
    setSelectedOrg(firstOrgId)
    setSelectedTagIds([])
  }, [organizations, setSelectedOrg, setOrgs, setSelectedTagIds])

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const toggleShowInfo = () => {
    setShowInfo((v) => !v)
  }

  return (
    <>
      <nav className="bg-white">
        <div className="flex flex-row justify-between gap-4">
          <div
            style={{ height: `${HEADER_HEIGHT}px` }}
            className="flex justify-between items-center px-2 gap-2"
          >
            <button onClick={toggleMenu}>
              {menuOpen ? <IoClose size={25} /> : <HiMenu size={25} />}
            </button>

            <Link
              className="hover:underline"
              to={`/orgs/${orgId}/projects/${projectId}/dashboard?projectSkip=${projectSkip}&projectLimit=${projectLimit}`}
            >
              Dashboard
            </Link>
          </div>

          <div className="flex flex-row items-center gap-5">
            {!isClassificationProject && <div id="fit-size-button"></div>}

            {!isGrid && (
              <div className="relative">
                <Tooltip tooltipChildren={<HoverText>Info</HoverText>} align="bottom" move={-5}>
                  <button
                    onClick={toggleShowInfo}
                    className={cn('text-brand1 rounded-md', { 'bg-brand1 text-white': showInfo })}
                  >
                    <BsInfoLg size={30} />
                  </button>
                </Tooltip>

                {showInfo && (
                  <div className="absolute top-14 left-1/2 z-20 -translate-x-1/2">
                    <FileInfo />
                  </div>
                )}
              </div>
            )}

            {!isGrid && <div className="w-0.5 h-9 rounded-lg bg-brand1"></div>}

            {isClassificationProject && (
              <div className="flex items-center gap-2">
                <BsFillGrid3X3GapFill size={25} />
                <ReactSwitch
                  onChange={setIsGrid}
                  checked={isGrid}
                  onColor="#043c4a"
                  checkedIcon={false}
                  uncheckedIcon={false}
                />
              </div>
            )}

            {isGrid && (
              <CustomSelect
                value={{
                  value: gridSize.toString(),
                  label: gridOptions.find((o) => o.value === gridSize.toString())?.label || '3 x 3'
                }}
                options={gridOptions}
                onChange={(e) => {
                  if (e) {
                    setGridSize(Number(e.value))
                  }
                }}
              />
            )}

            {!isGrid && (
              <>
                {selectedFile && !selectedFile.skipped && <SkipButton />}
                {selectedFile?.skipped && (
                  <div className="flex items-center px-3 gap-2 py-2 bg-red-500 text-white rounded-lg">
                    <p>Skipped</p>

                    <BiX size={25} />
                  </div>
                )}
              </>
            )}

            {selectedFile && !selectedFile.complete && <CompleteButton />}
            {selectedFile?.complete && (
              <div className="flex px-3 gap-2 py-2 bg-green-500  text-white rounded-lg">
                <p>Completed</p>

                <BiCheck size={25} />
              </div>
            )}
          </div>

          <HeaderCore />
        </div>
      </nav>
      <div
        className={cn('absolute top-15 bottom-0 bg-brand1 text-white z-50 pt-4', {
          'left-0 duration-300': menuOpen,
          'left-[-100%] duration-300': !menuOpen
        })}
        style={{ width: `${SIDEBAR_WIDTH}px` }}
      >
        <SidebarCore />
      </div>
    </>
  )
}

export default HeaderLayout
