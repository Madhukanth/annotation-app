import { FC, RefObject } from 'react'

import CommentList from '@renderer/components/Annotate/CommentList'
import AnnotationList from './AnnotationList'
import { cn } from '@renderer/utils/cn'

type TabsName = 'annotation_list' | 'comments'
type AnnotationTabsProps = {
  videoRef: RefObject<HTMLVideoElement>
  imgLoaded: boolean
  selectedTab: TabsName
  setSelectedTab: (val: TabsName) => void
  onAddPolyPoints: (polyId: string) => void
  onAddLinePoints: (lineId: string) => void
}
const AnnotationTabs: FC<AnnotationTabsProps> = ({
  selectedTab,
  setSelectedTab,
  videoRef,
  onAddPolyPoints,
  imgLoaded,
  onAddLinePoints
}) => {
  const handleSelectTab = (val: TabsName) => () => {
    setSelectedTab(val)
  }

  return (
    <div className="grid gap-4 h-full" style={{ gridTemplateRows: 'auto minmax(0, 1fr)' }}>
      <div className="w-full border gap-2 bg-font-0.14 rounded-lg p-1 flex items-center">
        <button
          className={cn('p-2 rounded-lg w-1/2', {
            'bg-brand text-white': selectedTab === 'annotation_list'
          })}
          onClick={handleSelectTab('annotation_list')}
        >
          Annotation
        </button>
        <button
          className={cn('w-1/2 p-2 rounded-lg', {
            'bg-brand text-white': selectedTab === 'comments'
          })}
          onClick={handleSelectTab('comments')}
        >
          Comments
        </button>
      </div>

      {selectedTab === 'annotation_list' && imgLoaded && (
        <AnnotationList
          videoRef={videoRef}
          onAddLinePoints={onAddLinePoints}
          onAddPolyPoints={onAddPolyPoints}
        />
      )}

      {selectedTab === 'comments' && <CommentList />}
    </div>
  )
}

export default AnnotationTabs
