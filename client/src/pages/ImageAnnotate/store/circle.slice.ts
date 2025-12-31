import { StateCreator } from 'zustand'

import CircleType from '@models/Circle.model'
import { ImageSlices } from './image.store'

export type CircleSlice = {
  circles: CircleType[]
  setCircles: (newCircle: CircleType[]) => void
  getCircleById: (circleId: string) => CircleType | null
  addCircle: (newCircle: CircleType) => void
  updateCircle: (circleId: string, updatedCircle: Partial<CircleType>) => void
  resizeCircle: (circleId: string, x2: number, y2: number) => void
  deleteCircle: (circleId: string) => void
}

export const createCircleSlice: StateCreator<ImageSlices, [], [], CircleSlice> = (set, get) => ({
  circles: [],
  setCircles: (circles) => {
    set({ circles })
  },

  getCircleById(circleId) {
    return get().circles.find(({ id }) => id === circleId) || null
  },

  addCircle: (newCircle) => {
    set((state) => ({ circles: [...state.circles, newCircle] }))
  },

  updateCircle: (circleId, updatedCircle) => {
    const eCircles = get().circles
    const updated = eCircles.map((c) => {
      if (c.id !== circleId) return c
      return { ...c, ...updatedCircle }
    })
    set({ circles: updated })
  },

  resizeCircle: (circleId, x2, y2) => {
    set((state) => ({
      circles: state.circles.map((circle) => {
        if (circle.id !== circleId) return circle

        return {
          ...circle,
          width: x2 - circle.x,
          height: y2 - circle.y
        }
      })
    }))
  },

  deleteCircle: (circleId) => {
    set((state) => ({
      circles: state.circles.filter((circle) => circle.id !== circleId)
    }))
  }
})
