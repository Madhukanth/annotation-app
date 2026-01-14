/**
 * Utilities Module Index
 * Central export point for all utility functions
 *
 * Usage:
 *   import { cn, generateId, getStoredUrl } from '@/utils'
 *   import { setAxiosDefaults } from '@/utils/api'
 *   import { supabase } from '@/utils/supabase'
 */

// Class name merging utility
export { cn } from './cn'

// Tooltip positioning utilities
export { getTooltipPosition, type Align } from './tooltip'

// General utilities
export {
  getStoredUrl,
  generateId,
  groupIntoChunks,
  getRandomAnnotationColor,
} from './vars'

// Data transformers
export {
  transformFileToLegacy,
  transformProjectToLegacy,
} from './transformers'

// Re-export submodules
export * from './api'
export * from './auth'
export * from './supabase'
