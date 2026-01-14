import { toast } from 'react-toastify'

export const successNotification = (message: string) => {
  toast(message, { type: 'success' })
}

export const warningNotification = (message: string) => {
  toast(message, { type: 'warning' })
}

export const errorNotification = (message: string) => {
  toast(message, { type: 'error' })
}

export const infoNotification = (message: string) => {
  toast(message, { type: 'info' })
}
