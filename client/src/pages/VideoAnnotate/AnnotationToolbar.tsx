import { FC, MouseEvent, RefObject } from 'react'
import { TbFocus, TbShape2 } from 'react-icons/tb'
import { BsCircle, BsSquare, BsHexagon } from 'react-icons/bs'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { shapesService, CreateShapeInput } from '@/services/supabase'
import { useOrgStore } from '@renderer/store/organization.store'
import { generateId } from '@renderer/utils/vars'
import Tooltip from '@/components/ui/Tooltip'
import HoverText from '@/components/ui/HoverText'
import { useUntrackedVideoStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type AnnotationToolbarProps = {
  videoRef: RefObject<HTMLVideoElement>
  finalizePolygon: () => void
  finalizeLine: () => void
  calculateCurrentFrame: () => number
}
const AnnotationToolbar: FC<AnnotationToolbarProps> = ({
  finalizePolygon,
  finalizeLine,
  videoRef,
  calculateCurrentFrame
}) => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  const getAllRectangles = useVideoStore((s) => s.getAllRectangles)
  const addRectangle = useVideoStore((s) => s.addRectangle)
  const getAllCircles = useVideoStore((s) => s.getAllCircles)
  const addCircle = useVideoStore((s) => s.addCircle)
  // const faces = useVideoStore((s) => s.faces)
  // const addFace = useVideoStore((s) => s.addFace)

  const isDrawingPolygon = useUntrackedVideoStore((s) => s.isDrawingPolygon)
  const setIsDrawingPolygon = useUntrackedVideoStore((s) => s.setIsDrawingPolygon)
  const isDrawingLine = useUntrackedVideoStore((s) => s.isDrawingLine)
  const setIsDrawingLine = useUntrackedVideoStore((s) => s.setIsDrawingLine)

  const { mutate: createShapeMutate } = useMutation({
    mutationFn: (input: CreateShapeInput) => shapesService.createShape(input)
  })

  const getScale = () => {
    const imgEle = videoRef.current
    if (!imgEle) return { scaleX: 1, scaleY: 1 }

    const scaleX = imgEle.offsetWidth / imgEle.videoWidth
    const scaleY = imgEle.offsetHeight / imgEle.videoHeight
    return { scaleX, scaleY }
  }

  const onAddRect = (e: MouseEvent<HTMLButtonElement>) => {
    const { scaleX, scaleY } = getScale()
    const currentFrame = calculateCurrentFrame()

    e.stopPropagation()
    const newRect = {
      id: generateId(),
      x: 0,
      y: 0,
      height: 100,
      width: 100,
      name: `Rectangle ${getAllRectangles().length + 1}`,
      notes: ''
    }
    addRectangle(currentFrame, {
      ...newRect,
      stroke: 'rgb(255, 0, 0)',
      strokeWidth: 2,
      orgId: orgId!,
      projectId: projectId!,
      fileId: fileId!
    })

    if (!orgId || !projectId || !fileId) return
    createShapeMutate({
      id: newRect.id,
      fileId,
      orgId,
      projectId,
      type: 'rectangle',
      name: newRect.name,
      notes: newRect.notes,
      x: newRect.x / scaleX,
      y: newRect.y / scaleY,
      height: newRect.height / scaleY,
      width: newRect.width / scaleX,
      strokeWidth: 2,
      atFrame: calculateCurrentFrame()
    })
  }

  const onAddCircle = (e: MouseEvent<HTMLButtonElement>) => {
    const { scaleX, scaleY } = getScale()
    const currentFrame = calculateCurrentFrame()

    e.stopPropagation()
    const newCircle = {
      id: generateId(),
      x: 50,
      y: 50,
      height: 100,
      width: 100,
      name: `Circle ${getAllCircles().length + 1}`,
      notes: ''
    }
    addCircle(currentFrame, {
      ...newCircle,
      stroke: 'rgb(255, 0, 0)',
      strokeWidth: 2,
      orgId: orgId!,
      projectId: projectId!,
      fileId: fileId!
    })

    if (!orgId || !projectId || !fileId) return
    createShapeMutate({
      id: newCircle.id,
      fileId,
      orgId,
      projectId,
      type: 'circle',
      name: newCircle.name,
      notes: newCircle.notes,
      x: newCircle.x / scaleX,
      y: newCircle.y / scaleY,
      height: newCircle.height / scaleY,
      width: newCircle.width / scaleX,
      strokeWidth: 2,
      atFrame: calculateCurrentFrame()
    })
  }

  // const onAddFace = (e: MouseEvent<HTMLButtonElement>) => {
  //   e.stopPropagation()
  //   const allPoints = [
  //     { x: 464, y: 61, id: generateId() }, // 0
  //     { x: 555, y: 101, id: generateId() }, // 1
  //     { x: 563, y: 196, id: generateId() }, // 2
  //     { x: 546, y: 288, id: generateId() }, // 3
  //     { x: 468, y: 330, id: generateId() }, // 4
  //     { x: 376, y: 279, id: generateId() }, // 5
  //     { x: 364, y: 202, id: generateId() }, // 6
  //     { x: 387, y: 92, id: generateId() }, // 7
  //     { x: 449, y: 144, id: generateId() }, // 8
  //     { x: 402, y: 135, id: generateId() }, // 9
  //     { x: 380, y: 162, id: generateId() }, // 10
  //     { x: 497, y: 146, id: generateId() }, // 11
  //     { x: 534, y: 137, id: generateId() }, // 12
  //     { x: 556, y: 168, id: generateId() }, // 13
  //     { x: 538, y: 168, id: generateId() }, // 14
  //     { x: 515, y: 158, id: generateId() }, // 15
  //     { x: 497, y: 168, id: generateId() }, // 16
  //     { x: 518, y: 174, id: generateId() }, // 17
  //     { x: 516, y: 166, id: generateId() }, // 18
  //     { x: 441, y: 165, id: generateId() }, // 19
  //     { x: 417, y: 154, id: generateId() }, // 20
  //     { x: 397, y: 167, id: generateId() }, // 21
  //     { x: 423, y: 173, id: generateId() }, // 22
  //     { x: 420, y: 164, id: generateId() }, // 23
  //     { x: 439, y: 214, id: generateId() }, // 24
  //     { x: 470, y: 210, id: generateId() }, // 25
  //     { x: 498, y: 219, id: generateId() }, // 26
  //     { x: 516, y: 256, id: generateId() }, // 27
  //     { x: 469, y: 251, id: generateId() }, // 28
  //     { x: 423, y: 256, id: generateId() }, // 29
  //     { x: 468, y: 273, id: generateId() } // 30
  //   ]

  //   addFace({
  //     id: generateId(),
  //     name: `Face ${faces.length + 1}`,
  //     notes: '',
  //     points: allPoints,
  //     stroke: 'rgb(255, 0, 0)',
  //     strokeWidth: 2,
  //     closed: false
  //   })
  // }

  const togglePolygonStartAndEnd = () => {
    if (isDrawingLine) {
      finalizeLine()
    }

    if (isDrawingPolygon) {
      finalizePolygon()
    } else {
      setIsDrawingPolygon(true)
    }
  }

  const toggleLineStatAndEnd = () => {
    if (isDrawingPolygon) {
      finalizePolygon()
    }

    if (isDrawingLine) {
      finalizeLine()
    } else {
      setIsDrawingLine(true)
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center text-center gap-5 pt-9">
      <Tooltip tooltipChildren={<HoverText>Add Rectangle</HoverText>} align="left" move={10}>
        <button onClick={onAddRect} className="rounded-lg p-3 hover:bg-brand">
          <BsSquare size={30} color="white" />
        </button>
      </Tooltip>

      <div className="w-4/5 h-1 rounded bg-white" />

      <Tooltip tooltipChildren={<HoverText>Add Circle</HoverText>} align="left" move={10}>
        <button onClick={onAddCircle} className="rounded-lg p-3 hover:bg-brand">
          <BsCircle size={30} color="white" />
        </button>
      </Tooltip>

      <div className="w-4/5 h-1 rounded bg-white" />

      <Tooltip tooltipChildren={<HoverText>Add Polygon</HoverText>} align="left" move={10}>
        <button onClick={togglePolygonStartAndEnd} className="rounded-lg p-3 hover:bg-brand">
          {isDrawingPolygon ? (
            <TbFocus size={30} color="white" />
          ) : (
            <BsHexagon size={30} color="white" />
          )}
        </button>
      </Tooltip>

      <div className="w-4/5 h-1 rounded bg-white" />

      <Tooltip tooltipChildren={<HoverText>Add Line</HoverText>} align="left" move={10}>
        <button onClick={toggleLineStatAndEnd} className="rounded-lg p-3 hover:bg-brand">
          {isDrawingLine ? (
            <TbFocus size={30} color="white" />
          ) : (
            <TbShape2 size={30} color="white" />
          )}
        </button>
      </Tooltip>
    </div>
  )
}

export default AnnotationToolbar
