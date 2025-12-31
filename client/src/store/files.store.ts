import { create } from 'zustand'

import FileType from '@models/File.model'
import { ShapeType } from '@models/Shape.model'

type FilesStoreState = {
  count: number
  setCount: (val: number) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  files: FileType[]
  selectedFile: FileType | null
  setSelectedFile: (value: FileType | null) => void
  setFiles: (fileList: FileType[]) => void
  addFiles: (fileList: FileType[]) => void
  selectNextFile: () => void
  selectPrevFile: () => void
  getNextFile: () => FileType | null
  getPrevFile: () => FileType | null
  appendFiles: (fileList: FileType[], keepCount?: number) => void
  getFileById: (fileId: string) => FileType | null
  getFileByDbIndex: (dbIndex: number) => FileType | null
  updateFile: (fileId: string, partialFile: Partial<FileType>) => void
  addShapeToFile: (fileId: string, shapeType: ShapeType['type'], uShape: ShapeType) => void
  updateFileShapes: (
    fileId: string,
    shapeId: string,
    shapeType: ShapeType['type'],
    uShape: Partial<ShapeType>
  ) => void
  deleteShapeFromFile: (fileId: string, shapeId: string, shapeType: ShapeType['type']) => void
}

export const useFilesStore = create<FilesStoreState>((set, get) => ({
  currentPage: 0,
  setCurrentPage(page) {
    set(() => ({ currentPage: page }))
  },
  count: 0,
  setCount(val) {
    const prevVal = get().count
    if (prevVal === val) return
    set(() => ({ count: val }))
  },
  files: [],
  selectedFile: null,
  setSelectedFile(value) {
    set(() => ({ selectedFile: value }))
  },
  setFiles(fileList) {
    set(() => ({ files: fileList }))
  },
  getPrevFile() {
    if (!get().selectedFile) {
      return null
    }

    const currentIndex = get().files.findIndex((f) => f.id === get().selectedFile!.id)
    if (currentIndex <= 0) return null

    return get().files[currentIndex - 1] || null
  },
  getNextFile() {
    if (!get().selectedFile) {
      return null
    }

    const currentIndex = get().files.findIndex((f) => f.id === get().selectedFile!.id)
    return get().files[currentIndex + 1] || null
  },
  selectNextFile() {
    set(() => ({ selectedFile: get().getNextFile() }))
  },
  selectPrevFile() {
    set(() => ({ selectedFile: get().getPrevFile() }))
  },
  appendFiles(fileList, keepCount = 0) {
    const oldFiles = keepCount === 0 ? [] : get().files.slice(-keepCount)
    set(() => ({ files: [...oldFiles, ...fileList] }))
  },
  addFiles(fileList) {
    const newList: FileType[] = [...get().files, ...fileList].sort(
      (a, b) => Number(a.dbIndex) - Number(b.dbIndex)
    )
    const jsonObject = newList.map((f) => JSON.stringify(f))
    const uniqueSet = new Set(jsonObject)
    const uniqueArray = Array.from(uniqueSet).map((f) => JSON.parse(f)) as FileType[]
    set(() => ({ files: uniqueArray }))
  },
  getFileById(fileId) {
    return get().files.find((f) => f.id === fileId) || null
  },
  getFileByDbIndex(dbIndex) {
    return get().files.find((f) => f.dbIndex === dbIndex) || null
  },
  updateFile(fileId, partialFile) {
    set((state) => ({
      files: state.files.map((file) => {
        if (file.id === fileId) {
          return { ...file, ...partialFile }
        }

        return file
      })
    }))
  },
  addShapeToFile(fileId, shapeType, uShape) {
    const shapeName = `${shapeType}s`
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            metadata: {
              ...f.metadata,
              [shapeName]: [...f.metadata[shapeName], uShape]
            }
          }
        }

        return f
      })
    }))
  },
  updateFileShapes(fileId, shapeId, shapeType, uShape) {
    const shapeName = `${shapeType}s`
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            metadata: {
              ...f.metadata,
              [shapeName]: f.metadata[shapeName].map((s) => {
                if (s.id === shapeId) {
                  return { ...s, ...uShape }
                }
                return s
              })
            }
          }
        }

        return f
      })
    }))
  },
  deleteShapeFromFile(fileId, shapeId, shapeType) {
    const shapeName = `${shapeType}s`
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            metadata: {
              ...f.metadata,
              [shapeName]: f.metadata[shapeName].filter((s) => s.id !== shapeId)
            }
          }
        }

        return f
      })
    }))
  }
}))
