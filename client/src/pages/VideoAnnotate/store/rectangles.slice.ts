import { StateCreator } from 'zustand'

import RectangleType from '@models/Circle.model'
import { VideoRectangleType } from '@models/Rectangle.model'
import { VideoSlices } from './video.store'

export interface RectSlice {
  rectangles: VideoRectangleType
  setRectangles: (rectangles: VideoRectangleType) => void
  getAllRectangles: () => RectangleType[]

  addRectangle: (frame: number, newRect: RectangleType) => void
  updateRectangle: (frame: number, rectId: string, updatedRect: RectangleType) => void
  deleteRectangle: (frame: number, id: string) => void
}

export const createRectSlice: StateCreator<VideoSlices, [], [], RectSlice> = (set, get) => ({
  rectangles: {},
  setRectangles: (rectangles) => {
    set({ rectangles })
  },
  getAllRectangles() {
    const rectangleWithFrames = get().rectangles
    let allRects: RectangleType[] = []
    for (const frame in rectangleWithFrames) {
      allRects = [...allRects, ...rectangleWithFrames[frame]]
    }
    return allRects
  },

  addRectangle: (frame, newRect) => {
    set((state) => ({
      rectangles: { ...state.rectangles, [frame]: [...(state.rectangles[frame] || []), newRect] }
    }))
  },

  updateRectangle: (frame, rectId, updatedRect) => {
    set((state) => ({
      rectangles: {
        ...state.rectangles,
        [frame]: state.rectangles[frame].map((rect) =>
          rect.id === rectId ? { ...rect, ...updatedRect } : rect
        )
      }
    }))
  },

  deleteRectangle: (frame, rectId) => {
    set((state) => ({
      rectangles: {
        ...state.rectangles,
        [frame]: state.rectangles[frame].filter((rect) => rect.id !== rectId)
      }
    }))
  }
})
