import { create } from 'zustand'

import AnnotationClass from '@models/AnnotationClass.model'

type ClassesStoreState = {
  classes: AnnotationClass[]
  setClasses: (classList: AnnotationClass[]) => void
  addClass: (newClass: AnnotationClass) => void
  getClassById: (classId: string) => AnnotationClass | null
  updateClass: (classId: string, partialClass: Partial<AnnotationClass>) => void
  deleteClass: (classId: string) => void

  selectedTagIds: AnnotationClass[]
  setSelectedTagIds: (tagIds: AnnotationClass[]) => void
}

export const useClassesStore = create<ClassesStoreState>((set, get) => ({
  classes: [],
  setClasses(classList) {
    set(() => ({ classes: classList }))
  },
  addClass(newClass) {
    set((state) => ({ classes: [...state.classes, newClass] }))
  },
  getClassById(classId) {
    return get().classes.find((c) => c.id === classId) || null
  },
  updateClass(classId, partialClass) {
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id === classId) {
          return { ...c, ...partialClass }
        }

        return c
      })
    }))
  },
  deleteClass(classId) {
    set((state) => ({
      classes: state.classes.filter((c) => c.id !== classId)
    }))
  },

  selectedTagIds: [],
  setSelectedTagIds(tagIds) {
    set({ selectedTagIds: tagIds })
  }
}))
