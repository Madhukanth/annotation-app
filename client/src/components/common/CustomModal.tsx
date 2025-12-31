import { FC, ReactNode, useCallback, useEffect } from 'react'
import Modal, { Styles } from 'react-modal'

const customStyles: Styles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '0px',
    borderRadius: '0px',
    border: 0,
    background: 'transparent'
  }
}

type ModalProps = {
  children: ReactNode
  isOpen: boolean
  closeModal?: () => void
}
const CustomModal: FC<ModalProps> = ({ children, isOpen, closeModal }) => {
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeModal) {
        closeModal()
      }
    },
    [closeModal]
  )

  useEffect(() => {
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyUp])

  const root = document.getElementById('root')
  if (!root) return null

  return (
    <Modal appElement={root} isOpen={isOpen} style={customStyles}>
      {children}
    </Modal>
  )
}

export default CustomModal
