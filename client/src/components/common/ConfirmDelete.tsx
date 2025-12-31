import { FC } from 'react'

type ConfirmDeleteProps = {
  loading?: boolean
  name: string
  onCancel: () => void
  onDelete: () => void
}

const ConfirmDelete: FC<ConfirmDeleteProps> = ({ loading = false, name, onCancel, onDelete }) => {
  return (
    <div className="bg-white rounded-lg px-6 py-6 max-w-[450px]">
      <p className="text-2xl mb-3">Confirm Delete</p>

      <p>Are you sure you want to delete {name}?</p>

      <div className="grid grid-cols-2 gap-2 mt-6">
        <button
          disabled={loading}
          className="p-2 rounded-md border-brand border text-brand disabled:opacity-50"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          disabled={loading}
          className="bg-red-500 p-2 rounded-md text-white disabled:opacity-50"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default ConfirmDelete
