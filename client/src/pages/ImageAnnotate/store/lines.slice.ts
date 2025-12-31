import { StateCreator } from 'zustand'

import PointType from '@models/Point.model'
import LineType from '@models/Line.model'
import { ImageSlices } from './image.store'

export interface LineSlice {
  lines: LineType[]
  setLines: (lines: LineType[]) => void

  addLine: (newLine: LineType) => void
  updateLine: (lineId: string, updatedLine: Partial<LineType>) => LineType
  deleteLine: (lineId: string) => void
  addPointsToLine: (lineId: string, newPoint: PointType | PointType[]) => void
  deletePointFromLine: (lineId: string, pointId: string) => LineType | null
}

export const createLineSlice: StateCreator<ImageSlices, [], [], LineSlice> = (set) => ({
  lines: [],
  setLines: (lines) => {
    set({ lines })
  },

  addLine: (newLine) => {
    set((state) => ({ lines: [...state.lines, newLine] }))
  },

  updateLine: (lineId, updatedLine) => {
    let uLine = { ...updatedLine }
    set((state) => {
      const updated = state.lines.map((line) => {
        if (line.id !== lineId) return line
        uLine = { ...line, ...updatedLine }
        return { ...line, ...updatedLine }
      })
      return { lines: updated }
    })

    return uLine as LineType
  },
  deleteLine: (lineId) => {
    set((state) => ({
      lines: state.lines.filter((line) => line.id !== lineId)
    }))
  },
  addPointsToLine: (lineId, newPoint) => {
    set((state) => {
      const pointsToAdd = Array.isArray(newPoint) ? newPoint : [newPoint]
      const updatedPoints = state.lines.map((line) => {
        if (line.id !== lineId) return line
        return { ...line, points: [...line.points, ...pointsToAdd] }
      })
      return { lines: updatedPoints }
    })
  },
  deletePointFromLine: (lineId, pointId) => {
    let uLine: LineType | null = null

    set((state) => ({
      lines: state.lines.map((line) => {
        if (line.id === lineId) {
          uLine = { ...line, points: line.points.filter((point) => point.id !== pointId) }
          return { ...uLine }
        }
        return line
      })
    }))
    return uLine
  }
})
