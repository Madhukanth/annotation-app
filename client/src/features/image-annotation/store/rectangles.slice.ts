import { StateCreator } from 'zustand'

import RectangleType from '@models/Rectangle.model'
import { ImageSlices } from './image.store'

export interface RectSlice {
  rectangles: RectangleType[]
  setRectangles: (rectangles: RectangleType[]) => void
  getRectangleById: (rectId: string) => RectangleType | null
  addRectangle: (newRect: RectangleType) => void
  updateRectangle: (rectId: string, updatedRect: RectangleType) => void
  resizeRectangle: (rectId: string, x2: number, y2: number) => void
  deleteRectangle: (id: string) => void
}

export const createRectSlice: StateCreator<ImageSlices, [], [], RectSlice> = (set, get) => ({
  rectangles: [],
  setRectangles: (rectangles) => {
    set({ rectangles })
  },

  getRectangleById(rectId) {
    return get().rectangles.find(({ id }) => id === rectId) || null
  },

  addRectangle: (newRect) => {
    set((state) => ({ rectangles: [...state.rectangles, newRect] }))
  },

  updateRectangle: (rectId, updatedRect) => {
    set((state) => ({
      rectangles: state.rectangles.map((rect) =>
        rect.id === rectId ? { ...rect, ...updatedRect } : rect
      )
    }))
  },

  resizeRectangle: (rectId, x2, y2) => {
    set((state) => ({
      rectangles: state.rectangles.map((rect) => {
        if (rect.id !== rectId) return rect

        return {
          ...rect,
          width: x2 - rect.x,
          height: y2 - rect.y
        }
      })
    }))
  },

  deleteRectangle: (rectId) => {
    set((state) => ({
      rectangles: state.rectangles.filter((rect) => rect.id !== rectId)
    }))
  }
})
