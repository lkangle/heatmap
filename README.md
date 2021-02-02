## Heatmap from [heatmap.js](https://github.com/pa7/heatmap.js)

![image-20210202190900850](https://gitee.com/likangle/static-file/raw/master/mac-pic/9pmc-20210202190901.png)

heatmap.js热图

- 使用typescript重构
- 扩展支持椭圆绘制

### 引入

1. 直接下载dist中heatmap.js到网页中
2. npm安装

```shell
npm install --save-dev @lkl/heatmap --registry=http://npm.lkangle.cn
```

### 初始化

```javascript
let heat = new Heatmap({
  blur: 0.85,
  container: document.getElementById('container')
})
```

- `container`：热图承载容器
- `backgroundColor`：热图背景色
- `gradient`：着色梯度
```json5
{
    0.25: 'rgb(0,0,255)',
    0.55: 'rgb(0,255,0)',
    0.85: 'yellow',
    1.0: 'rgb(255,0,0)'
}
```
- `opacity`：透明度
- `maxOpacity`：最大透明度（默认: 1）
- `minOpacity`：最小透明度（默认: 0）
- `onExtremaChange`：极值变化监听
- `blur`：模糊程度（默认: 0.85）

### 方法

##### `setData`：设置数据

> heat.setData(object)

```javascript
heat.setData({
  min: 0,
  max: 5,
  data: [{
    position: {
      top: 10,
      left: 200,
      width: 80,
      height: 80
    },
    value: 1
  }]
})
```

##### `addData`：添加数据

> heat.addData(array|object)

```javascript
heat.addData({
  position: {
    top: 10,    // 矩形左上角顶点top
    left: 200,  // 矩形左上角顶点left
    width: 80,  // 矩形宽
    height: 80  // 矩形高
  },
  value: 1      // 当前点的值
})
```

##### `setExtremum`：更新极值

> heat.setExtremum(min, max)

##### `repaint`：重绘

> heat.repaint()

##### `getDataURL`：获取base64值

> heat.getDataURL()
