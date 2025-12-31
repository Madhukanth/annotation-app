import { FC } from 'react'
import Skeleton from 'react-loading-skeleton'

const CardSkeleton: FC = () => {
  return (
    <div className="w-full border border-font-0.14 rounded-lg bg-white h-fit">
      <div className="w-full h-52 relative rounded-t-lg">
        <Skeleton
          baseColor="#c5cccf"
          borderRadius="8px 8px 0 0"
          className="absolute top-0 left-0 bottom-0 right-0"
        />
      </div>

      <div className="py-2 px-4 pb-4">
        <Skeleton width="70%" baseColor="#c5cccf" count={1} />
        <Skeleton width="50%" baseColor="#c5cccf" count={1} />
        <div className="grid grid-cols-3 gap-4 mt-3">
          <Skeleton baseColor="#c5cccf" count={1} borderRadius={10} height={30} />
          <div />
          <Skeleton baseColor="#c5cccf" count={1} borderRadius={10} height={30} />
        </div>
      </div>
    </div>
  )
}

export default CardSkeleton
