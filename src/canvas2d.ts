import { HeatmapConfig, HeatData, PointInfo, Position } from './typings'
import { getColorPalette } from './utils'

function getPointTemplate(pos: Position, blurFactor: number, globalAlpha: number): HTMLCanvasElement {
  const tplCanvas = document.createElement('canvas')
  const tplCtx = tplCanvas.getContext('2d')
  tplCanvas.width = pos.width
  tplCanvas.height = pos.height
  const sideLen = Math.max(pos.height, pos.width)
  const radius = sideLen / 2

  tplCtx.scale(pos.width / sideLen, pos.height / sideLen)
  if (+blurFactor >= 1) {
    tplCtx.beginPath()
    tplCtx.arc(radius, radius, radius, 0, Math.PI * 2)
    tplCtx.fillStyle = 'rgba(0,0,0,1)'
    tplCtx.globalAlpha = globalAlpha
    tplCtx.fill()
  } else {
    const gradient = tplCtx.createRadialGradient(radius, radius, radius * blurFactor, radius, radius, radius)
    gradient.addColorStop(0, 'rgba(0,0,0,1)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    tplCtx.fillStyle = gradient
    tplCtx.globalAlpha = globalAlpha
    tplCtx.fillRect(0, 0, sideLen, sideLen)
  }
  return tplCanvas
}

class Canvas2dRenderer {
  public canvas: HTMLCanvasElement
  private shadowCanvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  private palette: Uint8ClampedArray
  private templates: any

  private min: number
  private max: number
  private width: number
  private height: number

  constructor(private config: HeatmapConfig) {
    const container = config.container
    this.canvas = document.createElement('canvas')
    this.shadowCanvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')

    this.min = 0
    this.max = 1
    this.templates = {}
    this.palette = getColorPalette(config)
    this.config.blur = (config.blur === 0) ? 0 : config.blur

    this.setStyles(config)
    container.style.position = 'relative'
    container.appendChild(this.canvas)
  }

  private setStyles(config: HeatmapConfig) {
    const computed = window.getComputedStyle(this.config.container)
    let width = +(computed.width.replace(/px/, ''))
    let height = +(computed.height.replace(/px/, ''))
    if (config.width && config.height) {
      width = Math.max(config.width, width)
      height = Math.max(config.height, height)
    }

    this.width = this.canvas.width = this.shadowCanvas.width = width
    this.height = this.canvas.height = this.shadowCanvas.height = height
    this.canvas.className = 'gio-heatmap-canvas'
    this.canvas.style.cssText = 'position:absolute;left:0;top:0;z-index:1999999;'

    if (config.backgroundColor) {
      this.canvas.style.backgroundColor = config.backgroundColor
    }
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  private drawAlpha(heatData: HeatData) {
    const min = this.min = heatData.min
    const max = this.max = heatData.max
    const points = heatData.data || []
    const blur = 1 - this.config.blur
    const ctx = this.ctx

    points.forEach((point: PointInfo) => {
      const top = point.position.top
      const left = point.position.left

      const value = Math.min(point.value, max)

      const templateAlpha = (value - min) / (max - min)
      const globalAlpha = templateAlpha < 0.01 ? 0.01 : templateAlpha

      const key = point.position.width + ':' + point.position.height + ':' + point.value
      let tpl
      if (!this.templates[key]) {
        this.templates[key] = tpl = getPointTemplate(point.position, blur, globalAlpha)
      } else {
        tpl = this.templates[key]
      }

      this.colorize(tpl)
      ctx.drawImage(tpl, left, top)
    })
  }

  /**
   * 用画板给黑白的热图染色
   */
  private colorize(canvas: HTMLCanvasElement) {
    const width = canvas.width
    const height = canvas.height
    const ctx = canvas.getContext('2d')
    const img = ctx.getImageData(0, 0, width, height)
    const imgData = img.data
    const palette = this.palette

    for (let i = 3; i < imgData.length; i += 4) {
      const alpha = imgData[i]
      const offset = alpha * 4

      if (!offset) {
        continue
      }

      const finalAlpha = this.computeAlpha(alpha)

      imgData[i - 3] = palette[offset]
      imgData[i - 2] = palette[offset + 1]
      imgData[i - 1] = palette[offset + 2]
      imgData[i] = finalAlpha // palette[offset + 3]
    }
    ctx.putImageData(img, 0, 0)
  }

  /**
   * 计算透明度
   * @param alpha 当前透明度 A的值
   */
  private computeAlpha(alpha: number) {
    const opacity = (this.config.opacity || 0) * 255
    const maxOpacity = this.config.maxOpacity * 255
    const minOpacity = this.config.minOpacity * 255
    let finalAlpha
    if (opacity > 0) {
      finalAlpha = opacity
    } else {
      if (alpha < maxOpacity) {
        if (alpha < minOpacity) {
          finalAlpha = minOpacity
        } else {
          finalAlpha = alpha
        }
      } else {
        finalAlpha = maxOpacity
      }
    }
    return finalAlpha
  }

  public renderPartial(data: HeatData) {
    if (data.data.length > 0) {
      this.drawAlpha(data)
    }
  }

  public renderAll(data: HeatData) {
    this.clear()
    this.renderPartial(data)
  }

  public getDataURL(): string {
    return this.canvas.toDataURL()
  }
}

export default Canvas2dRenderer
