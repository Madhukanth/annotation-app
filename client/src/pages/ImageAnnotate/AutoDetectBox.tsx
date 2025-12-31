import { cn } from '@renderer/utils/cn'
import { MouseEvent, useRef, useState } from 'react'

const calculateposition = (xc: number, yc: number, startX: number, startY: number) => {
  const x1 = Math.min(xc, startX)
  const y1 = Math.min(yc, startY)
  let x2 = Math.max(xc, startX)
  let y2 = Math.max(yc, startY)

  if (x2 <= x1) {
    x2 = x1 + 1
  }

  if (y2 <= y1) {
    y2 = y1 + 1
  }

  const width = x2 - x1
  const height = y2 - y1
  return { left: x1, x2, top: y1, y2, width, height }
}

const AutoDetectBox = () => {
  const drawingBoardRef = useRef<HTMLDivElement>(null)
  const newBoxRef = useRef<HTMLDivElement>(null)
  const startCoordRef = useRef({ x: 0, y: 0 })
  const colorRef = useRef('red')
  const drawComplete = useRef(false)
  const [isDrawing, setDrawing] = useState(true)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (drawComplete.current) return
    const { pageX: xc, pageY: yc } = e

    let offsetLeft = 0
    let offsetTop = 0
    if (drawingBoardRef.current) {
      const rect = drawingBoardRef.current.getBoundingClientRect()
      offsetLeft = rect.left
      offsetTop = rect.top
    }

    if (!isDrawing || !newBoxRef.current) return

    const { x: startX, y: startY } = startCoordRef.current
    const { top, left, height, width } = calculateposition(
      xc - offsetLeft,
      yc - offsetTop,
      startX - offsetLeft,
      startY - offsetTop
    )

    newBoxRef.current.style.top = `${top}px`
    newBoxRef.current.style.left = `${left}px`
    newBoxRef.current.style.width = `${width}px`
    newBoxRef.current.style.height = `${height}px`
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const { pageX: startX, pageY: startY } = e
    startCoordRef.current.x = startX
    startCoordRef.current.y = startY

    if (!isDrawing) setDrawing(true)
  }

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!drawingBoardRef.current) return

    const { top: offsetTop, left: offsetLeft } = drawingBoardRef.current.getBoundingClientRect()
    const { pageX: xc, pageY: yc } = e
    const { x: startX, y: startY } = startCoordRef.current
    const box = calculateposition(
      xc - offsetLeft,
      yc - offsetTop,
      startX - offsetLeft,
      startY - offsetTop
    )

    const { offsetHeight, offsetWidth } = drawingBoardRef.current
    console.log({
      top: box.top / offsetHeight,
      left: box.left / offsetWidth,
      width: box.width / offsetWidth,
      height: box.height / offsetHeight,
      x2: box.x2 / offsetWidth,
      y2: box.y2 / offsetHeight,
      color: colorRef.current
    })

    startCoordRef.current.x = 0
    startCoordRef.current.y = 0
    drawComplete.current = true
  }

  return (
    <div
      className="absolute top-0 left-0 right-0 bottom-0 cursor-crosshair z-20"
      ref={drawingBoardRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div
        ref={newBoxRef}
        className={cn(
          'absolute z-10 bg-transparent box-border border-2 border-red-500 border-solid',
          { visible: isDrawing, hidden: isDrawing }
        )}
      ></div>
    </div>
  )
}

export default AutoDetectBox
