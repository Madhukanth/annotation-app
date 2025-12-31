import { StateCreator } from 'zustand'

import PolygonType, { VideoPolygonType } from '@models/Polygon.model'
import PointType from '@models/Point.model'
import { VideoSlices } from './video.store'

export interface PolySlice {
  polygons: VideoPolygonType
  setPolygons: (polygons: VideoPolygonType) => void
  getAllPolygons: () => PolygonType[]

  addPolygon: (frame: number, newPolygon: PolygonType) => void
  updatePolygon: (
    frame: number,
    polyId: string,
    updatedPolygon: Partial<PolygonType>
  ) => PolygonType
  deletePolygon: (frame: number, polyId: string) => void
  addPointsToPolygon: (frame: number, polyId: string, newPoint: PointType | PointType[]) => void
  deletePointFromPolygon: (frame: number, polyId: string, pointId: string) => PolygonType | null
}

export const createPolySlice: StateCreator<VideoSlices, [], [], PolySlice> = (set, get) => ({
  polygons: {},
  setPolygons: (polygons) => {
    set({ polygons })
  },
  getAllPolygons: () => {
    const polyWithFrames = get().polygons
    let allPolys: PolygonType[] = []
    for (const frame in polyWithFrames) {
      allPolys = [...allPolys, ...polyWithFrames[frame]]
    }
    return allPolys
  },

  addPolygon: (frame, newPolygon) => {
    set((state) => ({
      polygons: { ...state.polygons, [frame]: [...(state.polygons[frame] || []), newPolygon] }
    }))
  },

  updatePolygon: (frame, polyId, updatedPolygon) => {
    let updatedPoly = { ...updatedPolygon }
    set((state) => {
      const updated = state.polygons[frame].map((poly) => {
        if (poly.id !== polyId) return poly
        updatedPoly = { ...poly, ...updatedPolygon }
        return { ...poly, ...updatedPolygon }
      })
      return { polygons: { ...state.polygons, [frame]: updated } }
    })
    return updatedPoly as PolygonType
  },
  deletePolygon: (frame, polyId) => {
    set((state) => ({
      polygons: {
        ...state.polygons,
        [frame]: state.polygons[frame].filter((poly) => poly.id !== polyId)
      }
    }))
  },
  addPointsToPolygon: (frame, polyId, newPoint) => {
    set((state) => {
      const pointsToAdd = Array.isArray(newPoint) ? newPoint : [newPoint]
      const updatedPoints = state.polygons[frame].map((poly) => {
        if (poly.id !== polyId) return poly
        return { ...poly, points: [...poly.points, ...pointsToAdd] }
      })
      return { polygons: { ...state.polygons, [frame]: updatedPoints } }
    })
  },
  deletePointFromPolygon: (frame, polyId, pointId) => {
    let uPoly: PolygonType | null = null

    set((state) => ({
      polygons: {
        ...state.polygons,
        [frame]: state.polygons[frame].map((poly) => {
          if (poly.id === polyId) {
            uPoly = { ...poly, points: poly.points.filter((point) => point.id !== pointId) }
            return { ...uPoly }
          }
          return poly
        })
      }
    }))

    return uPoly
  }
})
