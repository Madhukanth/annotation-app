import { create } from 'zustand'
import { temporal } from 'zundo'

import { CircleSlice, createCircleSlice } from './circle.slice'
import { FaceSlice, createFaceSlice } from './faces.slice'
import { LineSlice, createLineSlice } from './lines.slice'
import { PolySlice, createPolySlice } from './polygons.slice'
import { RectSlice, createRectSlice } from './rectangles.slice'

export type VideoSlices = CircleSlice & FaceSlice & LineSlice & PolySlice & RectSlice

export const useVideoStore = create<VideoSlices>()(
  temporal(
    (...a) => ({
      ...createCircleSlice(...a),
      ...createFaceSlice(...a),
      ...createLineSlice(...a),
      ...createPolySlice(...a),
      ...createRectSlice(...a)
    }),
    { limit: 10 }
  )
)

export type VideoUntrackedStore = {
  selectedCircleId: string | null
  setSelectedCircleId: (value: string | null) => void

  selectedFaceId: string | null
  setSelectedFaceId: (faceId: string | null) => void

  selectedLineId: string | null
  setSelectedLineId: (faceId: string | null) => void

  selectedLinePoint: { lineId: string; pointId: string } | null
  setSelectedLinePoint: (part: { lineId: string; pointId: string } | null) => void

  isDrawingLine: true | string | null
  setIsDrawingLine: (value: true | string | null) => void

  selectedPolyId: string | null
  setSelectedPolyId: (faceId: string | null) => void

  selectedPolyPoint: { polyId: string; pointId: string } | null
  setSelectedPolyPoint: (part: { polyId: string; pointId: string } | null) => void

  isDrawingPolygon: true | string | null
  setIsDrawingPolygon: (value: true | string | null) => void

  selectedRectangleId: string | null
  setSelectedRectangleId: (circleId: string | null) => void
}

export const useUntrackedVideoStore = create<VideoUntrackedStore>((set) => ({
  selectedCircleId: null,
  setSelectedCircleId: (value) => {
    set({ selectedCircleId: value })
  },

  selectedFaceId: null,
  setSelectedFaceId: (faceId) => {
    set({ selectedFaceId: faceId })
  },

  selectedLineId: null,
  setSelectedLineId: (lineId) => {
    set({ selectedLineId: lineId })
  },

  selectedLinePoint: null,
  setSelectedLinePoint: (part) => {
    set({ selectedLinePoint: part })
  },

  isDrawingLine: null,
  setIsDrawingLine: (value) => {
    set({ isDrawingLine: value })
  },

  selectedPolyId: null,
  setSelectedPolyId: (polyId) => {
    set({ selectedPolyId: polyId })
  },

  selectedPolyPoint: null,
  setSelectedPolyPoint: (part) => {
    set({ selectedPolyPoint: part })
  },

  isDrawingPolygon: null,
  setIsDrawingPolygon: (value) => {
    set({ isDrawingPolygon: value })
  },

  selectedRectangleId: null,
  setSelectedRectangleId: (rectId) => {
    set({ selectedRectangleId: rectId })
  }
}))

export type VideoPlayerStore = {
  currentTimeAndFrameMap: { time: number; frame: number }
  setCurrentTimeAndFrame: (val: { time: number; frame: number }) => void
}

export const useVideoPlayerStore = create<VideoPlayerStore>((set) => ({
  currentTimeAndFrameMap: { frame: 0, time: 0 },
  setCurrentTimeAndFrame(val) {
    set({ currentTimeAndFrameMap: val })
  }
}))
