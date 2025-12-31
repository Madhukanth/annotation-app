import { StateCreator } from 'zustand'

import FaceType, { VideoFaceType } from '@models/Face.model'
import { VideoSlices } from './video.store'

export interface FaceSlice {
  faces: VideoFaceType
  setFaces: (faces: VideoFaceType) => void
  getAllFaces: () => FaceType[]

  addFace: (frame: number, newFace: FaceType) => void
  updateFace: (frame: number, faceId: string, updatedFace: Partial<FaceType>) => void
  deleteFace: (frame: number, faceId: string) => void
}

export const createFaceSlice: StateCreator<VideoSlices, [], [], FaceSlice> = (set, get) => ({
  faces: {},
  setFaces: (faces) => {
    set({ faces })
  },
  getAllFaces() {
    const facesWithFrames = get().faces
    let allFaces: FaceType[] = []
    for (const frame in facesWithFrames) {
      allFaces = [...allFaces, ...facesWithFrames[frame]]
    }
    return allFaces
  },

  addFace: (frame, newFace) => {
    set((state) => ({
      faces: { ...state.faces, [frame]: [...(state.faces[frame] || []), newFace] }
    }))
  },

  updateFace: (frame, faceId, updatedFace) => {
    set((state) => {
      const updated = state.faces[frame].map((f) => {
        if (f.id !== faceId) return f
        return { ...f, ...updatedFace }
      })
      return { faces: { ...state.faces, [frame]: updated } }
    })
  },

  deleteFace: (frame, faceId) => {
    set((state) => ({
      faces: { ...state.faces, [frame]: state.faces[frame].filter((f) => f.id !== faceId) }
    }))
  }
})
