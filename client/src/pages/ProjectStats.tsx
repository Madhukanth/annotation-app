import { useParams } from 'react-router-dom'

import { useProjectStats } from '@/hooks/useStats'

const ProjectStats = () => {
  const { projectid: projectId } = useParams()

  const { data: stats = [] } = useProjectStats(projectId || '')

  const sortedStats = [...stats].sort((a, b) => a.userName.localeCompare(b.userName))

  return (
    <div className="overflow-scroll h-full">
      <p className="text-xl">Stats</p>

      <table className="w-full mt-4">
        <thead>
          <tr className="border-b">
            <th className="text-start h-12">Name</th>
            <th className="text-start h-12">Assigned</th>
            <th className="text-start h-12">Completed</th>
            <th className="text-start h-12">Skipped</th>
            <th className="text-start h-12">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {sortedStats.map((stat) => (
            <tr className="border-b last:border-none" key={stat.userId}>
              <td className="h-12">{stat.userName}</td>
              <td className="h-12">{stat.assignedCount}</td>
              <td className="h-12">{stat.completedCount}</td>
              <td className="h-12">{stat.skippedCount}</td>
              <td className="h-12">
                {stat.assignedCount - (stat.completedCount + stat.skippedCount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProjectStats
