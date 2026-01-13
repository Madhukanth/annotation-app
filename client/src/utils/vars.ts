import { Storage } from '@models/Project.model'

export const getStoredUrl = (url: string, storedIn?: Storage) => {
  if (!storedIn || storedIn === 'default') {
    return `${import.meta.env.VITE_SERVER_ENDPOINT}/static${url}`
  }

  return url
}

export const generateId = () => {
  return crypto.randomUUID()
}

export function groupIntoChunks<T>(array: T[], chunkSize: number) {
  const result = []
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize))
  }
  return result
}

export function getRandomAnnotationColor() {
  // Generate random hue, saturation, and lightness values
  const hue = Math.floor(Math.random() * 360) // Random hue (0-360 degrees)
  const saturation = 70 + Math.random() * 20 // Saturation between 70% and 90%
  const lightness = 50 + Math.random() * 10 // Lightness between 50% and 60%

  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100
    l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
  }

  // Get random color in rgb format (consistent with ChromePicker and shapes service)
  const [r, g, b] = hslToRgb(hue, saturation, lightness)
  return `rgb(${r}, ${g}, ${b})`
}
