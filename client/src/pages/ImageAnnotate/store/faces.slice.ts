import { StateCreator } from 'zustand'

import FaceType from '@models/Face.model'
import { ImageSlices } from './image.store'

export interface FaceSlice {
  faces: FaceType[]
  setFaces: (faces: FaceType[]) => void

  addFace: (newFace: FaceType) => void
  updateFace: (faceId: string, updatedFace: Partial<FaceType>) => void
  deleteFace: (faceId: string) => void
}

export const createFaceSlice: StateCreator<ImageSlices, [], [], FaceSlice> = (set, get) => ({
  faces: [],
  setFaces: (faces) => {
    set({ faces })
  },

  addFace: (newFace) => {
    set((state) => ({ faces: [...state.faces, newFace] }))
  },

  updateFace: (faceId, updatedFace) => {
    const eFaces = get().faces
    const updated = eFaces.map((f) => {
      if (f.id !== faceId) return f
      return { ...f, ...updatedFace }
    })

    set({ faces: updated })
  },

  deleteFace: (faceId) => {
    set((state) => ({
      faces: state.faces.filter((f) => f.id !== faceId)
    }))
  }
})
