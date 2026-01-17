import { create } from 'zustand'
import { temporal } from 'zundo'

import { CircleSlice, createCircleSlice } from './circle.slice'
import { FaceSlice, createFaceSlice } from './faces.slice'
import { LineSlice, createLineSlice } from './lines.slice'
import { PolySlice, createPolySlice } from './polygons.slice'
import { RectSlice, createRectSlice } from './rectangles.slice'
import AnnotationClass from '@renderer/models/AnnotationClass.model'

export type ImageSlices = CircleSlice & FaceSlice & LineSlice & PolySlice & RectSlice

export const useImageStore = create<ImageSlices>()(
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

type Shapes = 'polygon' | 'rectangle' | 'circle' | 'face' | 'line' | 'ai'

type ImageUntrackedStore = {
  selectedClass: AnnotationClass | null
  setSelectedClass: (value: AnnotationClass | null) => void

  selectedShape: { type: Shapes; id: string } | null
  setSelectedShape: (value: { type: Shapes; id: string } | null) => void

  drawingShape: { type: Shapes; id: string | null } | null
  setDrawingShape: (value: { type: Shapes; id: string | null } | null) => void

  selectedLinePoint: { lineId: string; pointId: string } | null
  setSelectedLinePoint: (part: { lineId: string; pointId: string } | null) => void

  selectedPolyPoint: { polyId: string; pointId: string } | null
  setSelectedPolyPoint: (part: { polyId: string; pointId: string } | null) => void

  aIPoints: { x1: number; y1: number; x2?: number; y2?: number } | null
  setAIPoints: (val: { x1: number; y1: number; x2?: number; y2?: number } | null) => void
}

export const useImageUntrackedStore = create<ImageUntrackedStore>((set, get) => ({
  selectedClass: null,
  setSelectedClass: (value) => {
    set({ selectedClass: value })
  },

  selectedShape: null,
  setSelectedShape(value) {
    set({ selectedShape: value })
  },

  drawingShape: null,
  setDrawingShape(value) {
    set({ drawingShape: value })
  },

  selectedLinePoint: null,
  setSelectedLinePoint: (part) => {
    if (part === null && get().selectedLinePoint === null) {
      return
    }

    if (
      part?.lineId === get().selectedLinePoint?.lineId &&
      part?.pointId === get().selectedLinePoint?.pointId
    ) {
      return
    }

    set({ selectedLinePoint: part })
  },

  selectedPolyPoint: null,
  setSelectedPolyPoint: (part) => {
    if (part === null && get().selectedPolyPoint === null) return
    if (
      part?.pointId === get().selectedPolyPoint?.pointId &&
      part?.polyId === get().selectedPolyPoint?.polyId
    ) {
      return
    }
    set({ selectedPolyPoint: part })
  },

  aIPoints: null,
  setAIPoints(val) {
    set({ aIPoints: val })
  }
}))
