export interface Extrema {
  min: number
  max: number
  gradient: object
}

export interface HeatmapConfig {
  container: HTMLElement
  width?: number,
  height?: number,
  backgroundColor?: string
  gradient?: object
  opacity?: number
  maxOpacity?: number
  minOpacity?: number
  onExtremaChange?: (e: Extrema) => void
  blur?: number
}

export interface Position {
  top: number
  left: number
  width: number
  height: number
}

export interface PointInfo {
  value: number
  position: Position
}

export interface HeatData {
  min: number
  max: number
  data: PointInfo[]
}

export const EventType = {
  RENDER_ALL: 'renderall',
  EXTREMA_CHANGE: 'extremachange',
  RENDER_PARTIAL: 'renderpartial'
}
