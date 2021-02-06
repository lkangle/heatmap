import {
  HeatData,
  HeatmapConfig, PointInfo
} from './typings'
import Canvas2dRenderer from './canvas2d'
import { getXY, mergeInfo } from './utils'

type PointData = { [K: string]: PointInfo }

class Store {
  private min: number
  private max: number
  private pointData: PointData
  private defaultRect = { width: 40, height: 40 }

  constructor(
    private config: HeatmapConfig,
    private renderer: Canvas2dRenderer
  ) {
    this.min = 0
    this.max = 1
    this.pointData = {}
  }

  private inferRect(point: PointInfo): PointInfo {
    const position = point.position
    if (!position.height || !position.width) {
      Object.assign(position, this.defaultRect)
    }
    return point
  }

  /**
   * 对同一个点的数据进行合并，并更新极值
   * @param points  点信息
   * @return pointData 新增的点信息
   */
  private organiseData(points: PointInfo[]): PointData {
    const pointData: PointData = {}
    points.forEach(point => {
      point = this.inferRect(point)
      const [x, y] = getXY(point)
      const key = x + ':' + y
      const prev = this.pointData[key]
      if (prev) {
        this.pointData[key] = pointData[key] = mergeInfo(prev, point)
      } else {
        this.pointData[key] = pointData[key] = point
      }
      const value = this.pointData[key].value

      this.min = Math.min(value, this.min)
      this.max = Math.max(value, this.max)
    })
    return pointData
  }

  public addData(data: PointInfo | PointInfo[]): Store {
    if (!Array.isArray(data)) {
      data = [data]
    }
    const min = this.min
    const max = this.max
    const newPd = this.organiseData(data)
    if (min === this.min && max === this.max) {
      this.renderer.renderPartial({
        min,
        max,
        data: Object.values(newPd)
      })
    } else {
      this.repaint()
    }
    return this
  }

  public setData(data: HeatData) {
    this.max = data.max
    this.min = data.min || 0
    this.organiseData(data.data)
    this.repaint()
    return this
  }

  public setExtremum(min: number, max: number, render = false) {
    this.min = min
    this.max = max
    render && this.renderer.renderAll(this.getInternalData())
  }

  public getInternalData(): HeatData {
    return {
      min: this.min,
      max: this.max,
      data: Object.values(this.pointData)
    }
  }

  public repaint() {
    this.onExtremaChange()
    this.renderer.renderAll(this.getInternalData())
  }

  private onExtremaChange() {
    this.config.onExtremaChange && this.config.onExtremaChange({
      min: this.min,
      max: this.max,
      gradient: this.config.gradient
    })
  }
}

export default Store
