import { HeatmapConfig, PointInfo } from './typings'

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

export function getXY(point: PointInfo): number[] {
  const pos = point.position
  return [pos.left + pos.width / 2, pos.top + pos.height / 2]
}

/**
 * 将点信息合并，保留面积更大的
 * @param source
 * @param target
 */
export function mergeInfo(source: PointInfo, target: PointInfo): PointInfo {
  let position = source.position
  if (position.width * position.height <
    target.position.width * target.position.height) {
    position = target.position
  }

  return {
    position,
    value: source.value + target.value
  }
}
