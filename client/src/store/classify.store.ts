import { create } from 'zustand'

import AnnotationClass from '@models/AnnotationClass.model'

type ClassifyStoreState = {
  selectedTags: AnnotationClass[]
  setSelectedTag: (tags: AnnotationClass[]) => void
  isGrid: boolean
  setIsGrid: (isGrid: boolean) => void
  gridSkip: number
  setGridSkip: (gridIndex: number) => void
  gridSize: number
  setGridSize: (gridSize: number) => void
  selectedImages: string[]
  setSelectedImages: (files: string[]) => void
}

export const useClassifyStore = create<ClassifyStoreState>((set) => ({
  selectedTags: [],
  setSelectedTag(tags) {
    set(() => ({ selectedTags: tags }))
  },
  isGrid: false,
  setIsGrid(isGrid) {
    set(() => ({ isGrid }))
  },
  gridSkip: 0,
  setGridSkip(gridSkip) {
    set(() => ({ gridSkip }))
  },
  gridSize: 9,
  setGridSize(gridSize) {
    set(() => ({ gridSize }))
  },
  selectedImages: [],
  setSelectedImages(images) {
    set(() => ({ selectedImages: images }))
  }
}))
