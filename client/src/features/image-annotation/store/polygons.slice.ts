import { StateCreator } from 'zustand'

import PolygonType from '@models/Polygon.model'
import PointType from '@models/Point.model'
import { ImageSlices } from './image.store'

export interface PolySlice {
  polygons: PolygonType[]
  setPolygons: (polygons: PolygonType[]) => void

  addPolygon: (newPolygon: PolygonType) => void
  updatePolygon: (polyId: string, updatedPolygon: Partial<PolygonType>) => PolygonType
  deletePolygon: (polyId: string) => void
  addPointsToPolygon: (polyId: string, newPoint: PointType | PointType[]) => void
  deletePointFromPolygon: (polyId: string, pointId: string) => PolygonType | null
}

export const createPolySlice: StateCreator<ImageSlices, [], [], PolySlice> = (set) => ({
  polygons: [],
  setPolygons: (polygons) => {
    set({ polygons })
  },

  addPolygon: (newPolygon) => {
    set((state) => ({ polygons: [...state.polygons, newPolygon] }))
  },

  updatePolygon: (polyId, updatedPolygon) => {
    let updatedPoly = { ...updatedPolygon }
    set((state) => {
      const updated = state.polygons.map((poly) => {
        if (poly.id !== polyId) return poly
        updatedPoly = { ...poly, ...updatedPolygon }
        return { ...poly, ...updatedPolygon }
      })
      return { polygons: updated }
    })

    return updatedPoly as PolygonType
  },
  deletePolygon: (polyId) => {
    set((state) => ({
      polygons: state.polygons.filter((poly) => poly.id !== polyId)
    }))
  },
  addPointsToPolygon: (polyId, newPoint) => {
    set((state) => {
      const pointsToAdd = Array.isArray(newPoint) ? newPoint : [newPoint]
      const updatedPoints = state.polygons.map((poly) => {
        if (poly.id !== polyId) return poly
        return { ...poly, points: [...poly.points, ...pointsToAdd] }
      })
      return { polygons: updatedPoints }
    })
  },
  deletePointFromPolygon: (polyId, pointId) => {
    let uPoly: PolygonType | null = null

    set((state) => ({
      polygons: state.polygons.map((poly) => {
        if (poly.id === polyId) {
          uPoly = { ...poly, points: poly.points.filter((point) => point.id !== pointId) }
          return { ...uPoly }
        }
        return poly
      })
    }))

    return uPoly
  }
})
