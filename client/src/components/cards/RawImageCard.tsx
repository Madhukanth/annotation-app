import { FC } from 'react'
import { Link } from 'react-router-dom'

import { ImageModel } from '@models/image.model'

type RawImageCardProp = { image: ImageModel; onDelete: () => void }
const RawImageCard: FC<RawImageCardProp> = ({ image, onDelete }) => {
  return (
    <div className="rounded-lg border border-gray-300 h-fit">
      <div className="flex justify-center items-center h-64 bg-black rounded-t-lg">
        <img className="max-h-full max-w-full object-cover" src={`stechfile://${image.absPath}`} />
      </div>

      <div className="p-4">
        <p className="text-xl text-gray-900">{image.name}</p>
        <p className="text-neutral-400">{image.createdAt}</p>
        <div className="flex justify-between mt-4">
          <Link
            to={image.id}
            className="rounded-3xl text-brand1 border text-sm border-gray-300 py-2 px-4"
          >
            Annotate
          </Link>
          <button
            onClick={onDelete}
            className="rounded-3xl text-red-500 border text-sm border-gray-300 py-2 px-4"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default RawImageCard
