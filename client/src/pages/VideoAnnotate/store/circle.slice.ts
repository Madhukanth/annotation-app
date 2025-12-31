import { StateCreator } from 'zustand'

import CircleType, { VideoCircleType } from '@models/Circle.model'
import { VideoSlices } from './video.store'

export type CircleSlice = {
  circles: VideoCircleType
  setCircles: (circles: VideoCircleType) => void
  getAllCircles: () => CircleType[]

  addCircle: (frame: number, newCircle: CircleType) => void
  updateCircle: (frame: number, circleId: string, updatedCircle: Partial<CircleType>) => void
  deleteCircle: (frame: number, circleId: string) => void
}

export const createCircleSlice: StateCreator<VideoSlices, [], [], CircleSlice> = (set, get) => ({
  circles: {},
  setCircles: (circles) => {
    set({ circles })
  },
  getAllCircles() {
    const circleWithFrames = get().circles
    let allCircles: CircleType[] = []
    for (const frame in circleWithFrames) {
      allCircles = [...allCircles, ...circleWithFrames[frame]]
    }
    return allCircles
  },

  addCircle(frame, newCircle) {
    set((state) => ({
      circles: { ...state.circles, [frame]: [...(state.circles[frame] || []), newCircle] }
    }))
  },

  updateCircle(frame, circleId, updatedCircle) {
    set((state) => ({
      circles: {
        ...state.circles,
        [frame]: state.circles[frame].map((c) => {
          if (c.id !== circleId) return c
          return { ...c, ...updatedCircle }
        })
      }
    }))
  },

  deleteCircle: (frame, circleId) => {
    set((state) => ({
      circles: {
        ...state.circles,
        [frame]: state.circles[frame].filter((circle) => circle.id !== circleId)
      }
    }))
  }
})
