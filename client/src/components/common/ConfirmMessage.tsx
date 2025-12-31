import { FC } from 'react'

type ConfirmDeleteProps = {
  loading?: boolean
  text: string
  onCancel: () => void
  onSubmit: () => void
}

const ConfirmMessage: FC<ConfirmDeleteProps> = ({ loading = false, text, onCancel, onSubmit }) => {
  return (
    <div className="bg-white rounded-lg px-6 py-6 max-w-[450px]">
      <p className="text-2xl mb-3">Confirm Action</p>

      <p>{text}</p>

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
          className="bg-brand p-2 rounded-md text-white disabled:opacity-50"
          onClick={onSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default ConfirmMessage
