import { FC, useEffect, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import ReviewCard from './ReviewCard'
import { useFilesStore } from '@renderer/store/files.store'
import { fetchProjectFiles } from '@renderer/helpers/axiosRequests'
import Pagination from '@renderer/components/common/Pagination'
import CardSkeleton from '@renderer/components/common/CardSkeleton'
import { SelectOption } from '@models/UI.model'
import AnnotationClass from '@renderer/models/AnnotationClass.model'
import { useParams } from 'react-router-dom'
import { MultiValue } from 'react-select'
import { BiX } from 'react-icons/bi'
import Button from '@renderer/components/common/Button'
import CustomSelect from '@renderer/components/common/Select'
import SearchAndSelectTags from '@renderer/components/common/SearchAndSelectTags'
import SearchAndSelectUsers from '@renderer/components/common/SearchUsers'
import DatePicker from 'react-date-picker'
import { useProjectStore } from '@renderer/store/project.store'

type ValuePiece = Date | null

type Value = ValuePiece | [ValuePiece, ValuePiece]

export type FileStatus = 'complete' | 'skipped' | 'annotated'
const fileStatusOptions = [
  { value: 'complete', label: 'Complete' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'annotated', label: 'Annotated' }
]

const ProjectReview: FC = () => {
  const { orgid: orgId, projectid: projectId } = useParams()
  const [selectedAnnotator, setSelectedAnnotator] = useState<SelectOption | null>(null)
  const [filterDate, setFilterDate] = useState<Value>()
  const [fileStatus, setFileStatus] = useState<FileStatus>('complete')
  const [filterTags, setFilterTags] = useState<AnnotationClass[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(0)
  const setCount = useFilesStore((s) => s.setCount)
  const setFiles = useFilesStore((s) => s.setFiles)

  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)

  const limit = 20
  const skip = currentPage * limit
  const { data, isFetching } = useQuery(
    [
      'project-files',
      {
        orgId: orgId!,
        projectId: projectId!,
        skip,
        limit,
        annotator: selectedAnnotator?.value,
        hasShapes: fileStatus === 'annotated' ? true : undefined,
        complete: fileStatus === 'complete' ? true : undefined,
        skipped: fileStatus === 'skipped' ? true : undefined,
        ...(filterDate && fileStatus === 'complete' && { completedAfter: filterDate as Date }),
        ...(filterDate && fileStatus === 'skipped' && { skippedAfter: filterDate as Date }),
        ...(filterTags && { tags: filterTags.map((tag) => tag.id) })
      }
    ],
    fetchProjectFiles,
    { initialData: { files: [], count: 0 }, enabled: !!orgId && !!projectId }
  )
  const totalPages = Math.ceil(data.count / limit)

  useEffect(() => {
    setCount(data.count)
  }, [data.count])

  useEffect(() => {
    setFiles(data.files)
  }, [data.files])

  const handleSelectTag = (val: MultiValue<AnnotationClass>) => {
    setFilterTags(val as AnnotationClass[])
  }

  const handleResetFilter = () => {
    setFileStatus('complete')
    setFilterTags([])
    setFilterDate(undefined)
    setSelectedAnnotator(null)
  }

  if (!project) {
    return <p>Project not found</p>
  }

  const isClassificationProject = project.taskType === 'classification'

  return (
    <div className="h-full">
      {filtersOpen && (
        <div className="absolute right-5 top-5 bottom-5 bg-white shadow-lg z-10 border-gray-700 rounded-md w-80">
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg">Filters</p>
              <button onClick={() => setFiltersOpen(false)}>
                <BiX size={25} />
              </button>
            </div>

            <div className="mt-6 flex justify-start">
              <Button className="py-2 w-full rounded-3xl" onClick={handleResetFilter}>
                Reset Filters
              </Button>
            </div>

            <div className="mt-4">
              <label className="text-sm opacity-55">File status</label>
              <CustomSelect
                value={{
                  label: fileStatusOptions.find((o) => o.value === fileStatus)!.label,
                  value: fileStatus
                }}
                options={
                  isClassificationProject ? fileStatusOptions.slice(0, 2) : fileStatusOptions
                }
                onChange={(val) => {
                  if (val) {
                    setFileStatus(val.value as FileStatus)
                  }
                }}
              />
            </div>

            {isClassificationProject && (
              <div className="mt-4">
                <label className="text-sm opacity-55">Classes</label>
                <SearchAndSelectTags
                  className="w-auto"
                  value={filterTags}
                  onChange={handleSelectTag}
                />
              </div>
            )}

            <div className="mt-4">
              <label className="text-sm opacity-55">Users</label>
              <SearchAndSelectUsers
                filterOtherThan={[
                  ...project.annotators,
                  ...project.dataManagers,
                  ...project.reviewers
                ]}
                filterCurrentUser={false}
                isMulti={false}
                value={selectedAnnotator as SelectOption}
                onChange={setSelectedAnnotator}
                isClearable
              />
            </div>

            <div className="mt-4">
              <label className="text-sm opacity-55">Date</label>
              <DatePicker
                disabled={fileStatus === 'annotated'}
                calendarProps={{ className: 'z-[990]' }}
                className="w-full bg-white border-0 h-9"
                onChange={setFilterDate}
                value={filterDate}
                calendarIcon={false}
              />
            </div>
          </div>
        </div>
      )}

      <div
        className="h-full w-full grid gap-4"
        style={{ gridTemplateRows: totalPages > 1 ? '40px 1fr 60px' : '40px 1fr' }}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-xl">
            Projects {'>'} {project.name}
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={() => setFiltersOpen(true)} className="py-2">
              Filters
            </Button>
          </div>
        </div>

        {isFetching && data.files.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max h-full overflow-scroll">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!isFetching && data.files.length === 0 && (
          <div className="flex flex-col items-center justify-center text-gray-500">
            No files found
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max overflow-scroll">
          {data.files.map((file) => {
            return (
              <ReviewCard
                key={file.id}
                image={file}
                limit={limit}
                skip={skip}
                polygons={file.metadata?.polygons || []}
                circles={file.metadata?.circles || []}
                rectangles={file.metadata?.rectangles || []}
                faces={file.metadata?.faces || []}
                lines={file.metadata?.lines || []}
                selectedAnnotatorId={selectedAnnotator?.value}
                filterDate={filterDate as Date}
                fileStatus={fileStatus}
                filterTags={filterTags.map((t) => t.id)}
                isClassification={isClassificationProject}
              />
            )
          })}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={({ selected }) => {
              setCurrentPage(selected)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ProjectReview
