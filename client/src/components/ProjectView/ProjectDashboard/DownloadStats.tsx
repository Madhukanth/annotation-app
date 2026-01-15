import { FC, useState } from 'react'
import { saveAs } from 'file-saver'

import { Button } from '@/components/ui/button'
import { errorNotification } from '@/components/ui/Notification'

const DownloadStats: FC<{ url: string; fileName: string; text: string }> = ({
  url,
  fileName,
  text
}) => {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      saveAs(blob, fileName) // Automatically triggers the download
    } catch (error) {
      errorNotification(`Failed to download ${fileName}`)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button disabled={isDownloading} onClick={handleDownload} className="py-2">
      {isDownloading ? 'Downloading...' : text}
    </Button>
  )
}

export default DownloadStats
