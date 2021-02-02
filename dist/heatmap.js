var Heatmap = (function () {
  'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  const defaultConfig = {
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
  };
  function mergeConfig(customConfig) {
    return Object.assign({}, defaultConfig, customConfig);
  }
  function getColorPalette(config) {
    const gradientConfig = config.gradient;
    const paletteCanvas = document.createElement('canvas');
    const paletteCtx = paletteCanvas.getContext('2d');
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
    Object.keys(gradientConfig).forEach(key => {
      gradient.addColorStop(+key, gradientConfig[key]);
    });
    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);
    return paletteCtx.getImageData(0, 0, 256, 1).data;
  }
  function getXY(point) {
    const pos = point.position;
    return [pos.left + pos.width / 2, pos.top + pos.height / 2];
  }
  /**
   * 将点信息合并，保留面积更大的
   * @param source
   * @param target
   */

  function mergeInfo(source, target) {
    let position = source.position;

    if (position.width * position.height < target.position.width * target.position.height) {
      position = target.position;
    }

    return {
      position,
      value: source.value + target.value
    };
  }

  const getPointTemplate = function (pos, blurFactor, globalAlpha) {
    const tplCanvas = document.createElement('canvas');
    const tplCtx = tplCanvas.getContext('2d');
    tplCanvas.width = pos.width;
    tplCanvas.height = pos.height;
    const sideLen = Math.max(pos.height, pos.width);
    const radius = sideLen / 2;
    tplCtx.scale(pos.width / sideLen, pos.height / sideLen);

    if (+blurFactor >= 1) {
      tplCtx.beginPath();
      tplCtx.arc(radius, radius, radius, 0, Math.PI * 2);
      tplCtx.fillStyle = 'rgba(0,0,0,1)';
      tplCtx.globalAlpha = globalAlpha;
      tplCtx.fill();
    } else {
      const gradient = tplCtx.createRadialGradient(radius, radius, radius * blurFactor, radius, radius, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      tplCtx.fillStyle = gradient;
      tplCtx.globalAlpha = globalAlpha;
      tplCtx.fillRect(0, 0, sideLen, sideLen);
    }

    return tplCanvas;
  };

  class Canvas2dRenderer {
    constructor(config) {
      this.config = config;

      _defineProperty(this, "canvas", void 0);

      _defineProperty(this, "shadowCanvas", void 0);

      _defineProperty(this, "ctx", void 0);

      _defineProperty(this, "palette", void 0);

      _defineProperty(this, "templates", void 0);

      _defineProperty(this, "min", void 0);

      _defineProperty(this, "max", void 0);

      _defineProperty(this, "width", void 0);

      _defineProperty(this, "height", void 0);

      const container = config.container;
      this.canvas = document.createElement('canvas');
      this.shadowCanvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.min = 0;
      this.max = 1;
      this.templates = {};
      this.palette = getColorPalette(config);
      this.config.blur = config.blur === 0 ? 0 : config.blur;
      this.setStyles(config);
      container.style.position = 'relative';
      container.appendChild(this.canvas);
    }

    setStyles(config) {
      const computed = window.getComputedStyle(this.config.container);
      this.width = this.canvas.width = this.shadowCanvas.width = +computed.width.replace(/px/, '');
      this.height = this.canvas.height = this.shadowCanvas.height = +computed.height.replace(/px/, '');
      this.canvas.className = 'heatmap-canvas';
      this.canvas.style.cssText = 'position:absolute;left:0;top:0;';

      if (config.backgroundColor) {
        this.canvas.style.backgroundColor = config.backgroundColor;
      }
    }

    clear() {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawAlpha(heatData) {
      const min = this.min = heatData.min;
      const max = this.max = heatData.max;
      const points = heatData.data || [];
      const blur = 1 - this.config.blur;
      const ctx = this.ctx;
      points.forEach(point => {
        const top = point.position.top;
        const left = point.position.left;
        const value = Math.min(point.value, max);
        const templateAlpha = (value - min) / (max - min);
        const globalAlpha = templateAlpha < 0.01 ? 0.01 : templateAlpha;
        const key = point.position.width + ':' + point.position.height + ':' + point.value;
        let tpl;

        if (!this.templates[key]) {
          this.templates[key] = tpl = getPointTemplate(point.position, blur, globalAlpha);
        } else {
          tpl = this.templates[key];
        }

        this.colorize(tpl);
        ctx.drawImage(tpl, left, top);
      });
    }
    /**
     * 用画板给黑白的热图染色
     */


    colorize(canvas) {
      const width = canvas.width;
      const height = canvas.height;
      const ctx = canvas.getContext('2d');
      const img = ctx.getImageData(0, 0, width, height);
      const imgData = img.data;
      const palette = this.palette;

      for (let i = 3; i < imgData.length; i += 4) {
        const alpha = imgData[i];
        const offset = alpha * 4;

        if (!offset) {
          continue;
        }

        const finalAlpha = this.computeAlpha(alpha);
        imgData[i - 3] = palette[offset];
        imgData[i - 2] = palette[offset + 1];
        imgData[i - 1] = palette[offset + 2];
        imgData[i] = finalAlpha; // palette[offset + 3]
      }

      ctx.putImageData(img, 0, 0);
    }
    /**
     * 根据灰度值计算最终图片的明亮度
     * @param alpha 黑白图灰度
     */


    computeAlpha(alpha) {
      const opacity = (this.config.opacity || 0) * 255;
      const maxOpacity = this.config.maxOpacity * 255;
      const minOpacity = this.config.minOpacity * 255;
      let finalAlpha;

      if (opacity > 0) {
        finalAlpha = opacity;
      } else {
        if (alpha < maxOpacity) {
          if (alpha < minOpacity) {
            finalAlpha = minOpacity;
          } else {
            finalAlpha = alpha;
          }
        } else {
          finalAlpha = maxOpacity;
        }
      }

      return finalAlpha;
    }

    renderPartial(data) {
      if (data.data.length > 0) {
        this.drawAlpha(data);
      }
    }

    renderAll(data) {
      this.clear();
      this.renderPartial(data);
    }

    getDataURL() {
      return this.canvas.toDataURL();
    }

  }

  class Store {
    constructor(config, renderer) {
      this.config = config;
      this.renderer = renderer;

      _defineProperty(this, "min", void 0);

      _defineProperty(this, "max", void 0);

      _defineProperty(this, "pointData", void 0);

      _defineProperty(this, "defaultRect", {
        width: 40,
        height: 40
      });

      this.min = 0;
      this.max = 1;
      this.pointData = {};
    }

    specRect(point) {
      const position = point.position;

      if (!position.height || !position.width) {
        Object.assign(position, this.defaultRect);
      }

      return point;
    }
    /**
     * 对同一个点的数据进行合并，并更新极值
     * @param points  点信息
     * @return pointData 新增的点信息
     */


    organiseData(points) {
      const pointData = {};
      points.forEach(point => {
        point = this.specRect(point);
        const [x, y] = getXY(point);
        const key = x + ':' + y;
        const value = point.value;
        const prev = this.pointData[key];

        if (prev) {
          this.pointData[key] = pointData[key] = mergeInfo(prev, point);
        } else {
          this.pointData[key] = pointData[key] = point;
        }

        this.min = Math.min(value, this.min);
        this.max = Math.max(value, this.max);
      });
      return pointData;
    }

    addData(data) {
      if (!Array.isArray(data)) {
        data = [data];
      }

      const min = this.min;
      const max = this.max;
      const newPd = this.organiseData(data);

      if (min === this.min && max === this.max) {
        this.renderer.renderPartial({
          min,
          max,
          data: Object.values(newPd)
        });
      } else {
        this.repaint();
      }

      return this;
    }

    setData(data) {
      this.max = data.max;
      this.min = data.min || 0;
      this.organiseData(data.data);
      this.repaint();
      return this;
    }

    setExtremum(min, max, render = false) {
      this.min = min;
      this.max = max;
      render && this.renderer.renderAll(this.getInternalData());
    }

    getInternalData() {
      return {
        min: this.min,
        max: this.max,
        data: Object.values(this.pointData)
      };
    }

    repaint() {
      this.onExtremaChange();
      this.renderer.renderAll(this.getInternalData());
    }

    onExtremaChange() {
      this.config.onExtremaChange && this.config.onExtremaChange({
        min: this.min,
        max: this.max,
        gradient: this.config.gradient
      });
    }

  }

  class Heatmap {
    constructor(config) {
      _defineProperty(this, "config", void 0);

      _defineProperty(this, "store", void 0);

      _defineProperty(this, "renderer", void 0);

      this.config = mergeConfig(config);
      this.renderer = new Canvas2dRenderer(this.config);
      this.store = new Store(this.config, this.renderer);
    }

    addData(data) {
      this.store.addData(data);
      return this;
    }

    setData(data) {
      this.store.setData(data);
      return this;
    }

    setExtremum(min, max) {
      this.store.setExtremum(min, max, true);
      return this;
    }

    repaint() {
      this.store.repaint();
      return this;
    }

    getDataURL() {
      return this.renderer.getDataURL();
    }

  }

  return Heatmap;

}());
//# sourceMappingURL=heatmap.js.map
