import { FC, useEffect, useState } from 'react'
import { FaRegImage } from 'react-icons/fa'
import { BsClockFill, BsFillCheckCircleFill, BsXCircleFill } from 'react-icons/bs'
import { useParams } from 'react-router-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { SingleValue } from 'react-select'

import { useQuery } from '@tanstack/react-query'
import { fetchProjectBasicInfo, fetchUserStats } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import SearchAndSelectUsers from '@renderer/components/common/SearchUsers'
import CustomSelect from '@renderer/components/common/Select'
import { SelectOption } from '@models/UI.model'
import { useProjectStore } from '@renderer/store/project.store'
import DownloadStats from '@renderer/components/ProjectView/ProjectDashboard/DownloadStats'

const graphOptions = [
  { label: 'lastweek', value: '7' },
  { label: 'lastmonth', value: '30' }
]

const ProjectDashboard: FC = () => {
  const [selectedGraphOption, setSelectedGraphOption] = useState(graphOptions[0])
  const [selectedUser, setSelectedUser] = useState<SelectOption | null>(null)
  const currentUser = useUserStore((s) => s.user)
  const { projectid: projectId } = useParams()
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)

  const selectedOrg = useOrgStore((s) => s.selectedOrg)

  const { data: projectInfo } = useQuery(
    ['project-info', { orgId: selectedOrg!, projectId: projectId! }],
    fetchProjectBasicInfo,
    {
      enabled: !!selectedOrg && !!projectId,
      initialData: { files: 0, completed: 0, skipped: 0, remaining: 0 }
    }
  )

  const { data: userStats } = useQuery(
    [
      'user-stats',
      {
        orgId: selectedOrg!,
        projectId: projectId!,
        userId: selectedUser?.value || currentUser!.id,
        lastdays: selectedGraphOption.value
      }
    ],
    fetchUserStats,
    { initialData: [], enabled: !!selectedOrg && !!projectId && !!selectedUser }
  )

  useEffect(() => {
    if (currentUser) {
      setSelectedUser({ value: currentUser.id, label: currentUser.name })
    }
  }, [currentUser])

  let isReviewer = false
  if (selectedUser?.value && project) {
    isReviewer = project.reviewers.includes(selectedUser.value)
  }

  const skippedData = userStats.map(({ end, skipped }) => [
    new Date(end).valueOf(),
    Number(skipped)
  ])
  const completedData = userStats.map(({ end, completed }) => [
    new Date(end).valueOf(),
    Number(completed)
  ])

  const options = {
    accessibility: { enabled: false },
    navigation: { buttonOptions: { enabled: false } },
    tooltip: { shared: true },
    title: { text: '' },
    plotOptions: { bar: { borderWidth: 0, borderRadius: 10 } },
    yAxis: [
      {
        title: {
          text: isReviewer ? 'Completed' : 'Annotated',
          style: { color: '#043c4a' }
        },
        labels: {
          step: 1,
          style: { color: '#043c4a', fontSize: '15px' }
        }
      }
    ],
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time',
        style: { color: '#043c4a' }
      },
      labels: {
        style: {
          color: '#043c4a',
          fontSize: '15px'
        }
      }
    },
    // responsive: {
    //   rules: [
    //     {
    //       condition: {
    //         maxWidth: 10
    //       },
    //       chartOptions: {
    //         legend: {
    //           enabled: false
    //         }
    //       }
    //     }
    //   ]
    // },
    time: { timezoneOffset: +240 },
    credits: { enabled: false },
    series: [
      {
        name: 'Completed',
        yAxis: 0,
        color: '#043c4a',
        type: 'column',
        borderWidth: 0,
        borderRadius: 4,
        data: completedData
      },
      {
        name: 'Skipped',
        yAxis: 0,
        type: 'column',
        borderWidth: 0,
        borderRadius: 4,
        data: skippedData
      }
    ]
  }

  const handleSelectGraphOption = (selected: SingleValue<SelectOption>) => {
    if (selected?.value && selected?.label) {
      setSelectedGraphOption({ value: selected.value, label: selected.label })
    }
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="h-full overflow-scroll">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-xl">
          Projects {'>'} {project.name}
        </p>

        <div className="flex items-center gap-3">
          <DownloadStats
            fileName={`${project.name}_annotations.json`}
            url={`${
              import.meta.env.VITE_SERVER_ENDPOINT
            }/orgs/${selectedOrg}/projects/${projectId}/export`}
            text="Export Annotations"
          />

          <DownloadStats
            fileName={`${project.name}_stats.csv`}
            url={`${
              import.meta.env.VITE_SERVER_ENDPOINT
            }/orgs/${selectedOrg}/projects/${projectId}/export-stats`}
            text="Export Stats"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-font">
        <div className="bg-gray-200 h-44 text-center rounded-lg p-2">
          <FaRegImage className="mx-auto mt-4" size={30} />
          <p className="mt-3 text-5xl font-semibold text-center">{projectInfo.files}</p>
          <p className="text-base text-center">Files</p>
        </div>
        <div className="bg-gray-200 h-44 rounded-lg p-2">
          <BsFillCheckCircleFill className="mx-auto mt-4" size={30} />
          <p className="mt-3 text-5xl font-semibold text-center">{projectInfo.completed}</p>
          <p className="text-base text-center">Completed</p>
        </div>
        <div className="bg-gray-200 h-44 rounded-lg p-2">
          <BsXCircleFill className="mx-auto mt-4" size={30} />
          <p className="mt-3 text-5xl font-semibold text-center">{projectInfo.skipped}</p>
          <p className="text-base text-center">Skipped</p>
        </div>
        <div className="bg-gray-200 h-44 rounded-lg p-2">
          <BsClockFill className="mx-auto mt-4" size={30} />
          <p className="mt-3 text-5xl font-semibold text-center">{projectInfo.remaining}</p>
          <p className="text-base text-center">Remaining</p>
        </div>
      </div>

      <div className="mt-14">
        <div className="mb-10 px-5 flex items-center justify-between">
          <p className="xs:text-xs sm:text-base md:text-2xl lg:text-2xl">Stats</p>

          <div className="flex flex-wrap items-center gap-4 sm:mt-10 md:mt-0 lg:mt-0 justify-end">
            {/* min-[640px]:mt-120 */}
            <div className="w-60">
              <SearchAndSelectUsers
                filterOtherThan={[
                  ...project.annotators,
                  ...project.reviewers,
                  ...project.dataManagers
                ]}
                filterCurrentUser={false}
                isMulti={false}
                value={selectedUser as SelectOption}
                onChange={setSelectedUser}
              />
            </div>
            <CustomSelect
              options={graphOptions}
              value={selectedGraphOption}
              onChange={handleSelectGraphOption}
            />
          </div>
        </div>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>
    </div>
  )
}

export default ProjectDashboard
