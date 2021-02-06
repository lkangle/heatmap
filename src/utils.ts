import { HeatmapConfig, PointInfo, Position } from './typings'

const defaultConfig: HeatmapConfig = {
  gradient: {
    0.25: 'rgb(0,0,255)',
    0.55: 'rgb(0,255,0)',
    0.85: 'yellow',
    1.0: 'rgb(255,0,0)'
  },
  maxOpacity: 1,
  minOpacity: 0,
  blur: 0.85,
  container: null
}

export function mergeConfig(customConfig: HeatmapConfig) {
  return Object.assign({}, defaultConfig, customConfig)
}

export function getColorPalette(config: HeatmapConfig) {
  const gradientConfig = config.gradient
  const paletteCanvas = document.createElement('canvas')
  const paletteCtx = paletteCanvas.getContext('2d')

  paletteCanvas.width = 256
  paletteCanvas.height = 1

  const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1)
  Object.keys(gradientConfig).forEach(key => {
    gradient.addColorStop(+key, gradientConfig[key])
  })

  paletteCtx.fillStyle = gradient
  paletteCtx.fillRect(0, 0, 256, 1)

  return paletteCtx.getImageData(0, 0, 256, 1).data
}

function pointRound(num: number): number {
  return Math.round(num / 10) * 10
}

export function getXY(point: PointInfo): number[] {
  const pos = point.position
  return [pointRound(pos.left + pos.width / 2) >> 0, pointRound(pos.top + pos.height / 2) >> 0]
}

/**
 * 比较两个面积的大小
 *
 * @param source
 * @param target
 * @return 0 一般大 >0 source更大 <0 target更大
 */
export function compareArea(source: Position, target: Position): number {
  return source.width * source.height - target.width * target.height
}

/**
 * 将点信息合并，保留面积更大的
 * @param source
 * @param target
 */
export function mergeInfo(source: PointInfo, target: PointInfo): PointInfo {
  let position = source.position
  if (compareArea(position, target.position) < 0) {
    position = target.position
  }

  return {
    position,
    value: source.value + target.value
  }
}
