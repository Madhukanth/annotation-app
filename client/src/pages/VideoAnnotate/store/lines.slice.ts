import { StateCreator } from 'zustand'

import PointType from '@models/Point.model'
import LineType, { VideoLineType } from '@models/Line.model'
import { VideoSlices } from './video.store'

export interface LineSlice {
  lines: VideoLineType
  setLines: (lines: VideoLineType) => void
  getAllLines: () => LineType[]

  addLine: (frame: number, newLine: LineType) => void
  updateLine: (frame: number, lineId: string, updatedLine: Partial<LineType>) => LineType
  deleteLine: (frame: number, lineId: string) => void
  addPointsToLine: (frame: number, lineId: string, newPoint: PointType | PointType[]) => void
  deletePointFromLine: (frame: number, lineId: string, pointId: string) => LineType | null
}

export const createLineSlice: StateCreator<VideoSlices, [], [], LineSlice> = (set, get) => ({
  lines: {},
  setLines: (lines) => {
    set({ lines })
  },
  getAllLines() {
    const lineWithFrames = get().lines
    let allLines: LineType[] = []
    for (const frame in lineWithFrames) {
      allLines = [...allLines, ...lineWithFrames[frame]]
    }
    return allLines
  },

  addLine: (frame, newLine) => {
    set((state) => ({
      lines: { ...state.lines, [frame]: [...(state.lines[frame] || []), newLine] }
    }))
  },

  updateLine: (frame, lineId, updatedLine) => {
    let uLine = { ...updatedLine }
    set((state) => {
      const updated = state.lines[frame].map((line) => {
        if (line.id !== lineId) return line
        uLine = { ...line, ...updatedLine }
        return { ...line, ...updatedLine }
      })
      return { lines: { ...state.lines, [frame]: updated } }
    })

    return uLine as LineType
  },
  deleteLine: (frame, lineId) => {
    set((state) => ({
      lines: { ...state.lines, [frame]: state.lines[frame].filter((line) => line.id !== lineId) }
    }))
  },
  addPointsToLine: (frame, lineId, newPoint) => {
    set((state) => {
      const pointsToAdd = Array.isArray(newPoint) ? newPoint : [newPoint]
      const updatedPoints = state.lines[frame].map((line) => {
        if (line.id !== lineId) return line
        return { ...line, points: [...line.points, ...pointsToAdd] }
      })
      return { lines: { ...state.lines, [frame]: updatedPoints } }
    })
  },
  deletePointFromLine: (frame, lineId, pointId) => {
    let uLine: LineType | null = null

    set((state) => ({
      lines: {
        ...state.lines,
        [frame]: state.lines[frame].map((line) => {
          if (line.id === lineId) {
            uLine = { ...line, points: line.points.filter((point) => point.id !== pointId) }
            return { ...uLine }
          }
          return line
        })
      }
    }))

    return uLine
  }
})
