/**
 * Geometry Types
 * Basic geometric primitives used across shape types
 */

export interface Point {
  id: string
  x: number
  y: number
}

export interface ImgSize {
  naturalHeight: number
  naturalWidth: number
  offsetTop: number
  offsetLeft: number
  offsetHeight: number
  offsetWidth: number
}
