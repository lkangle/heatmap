import {
  HeatData,
  HeatmapConfig, PointInfo
} from './typings'
import { mergeConfig } from './utils'
import Canvas2dRenderer from './canvas2d'
import Store from './store'

class Heatmap {
  public config: HeatmapConfig
  private store: Store
  public renderer: Canvas2dRenderer

  constructor(config: HeatmapConfig) {
    this.config = mergeConfig(config)
    this.renderer = new Canvas2dRenderer(this.config)
    this.store = new Store(this.config, this.renderer)
  }

  public addData(data: PointInfo | PointInfo[]): Heatmap {
    this.store.addData(data)
    return this
  }

  public setData(data: HeatData): Heatmap {
    this.store.setData(data)
    return this
  }

  public setExtremum(min: number, max: number): Heatmap {
    this.store.setExtremum(min, max, true)
    return this
  }

  public repaint() {
    this.store.repaint()
    return this
  }

  public getDataURL(): string {
    return this.renderer.getDataURL()
  }
}

export default Heatmap
