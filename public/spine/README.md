# Spine 资源目录

本目录用于存放 Spine 动画资源文件。

## 文件格式要求

每个 Spine 动画需要以下文件：

1. **骨骼数据** - `.json` 或 `.skel`（二进制格式）
2. **图集描述** - `.atlas`
3. **纹理图片** - `.png`（与 atlas 同名）

## 目录结构

```
public/spine/
├── characters/          # 角色动画
│   ├── xiaoxue.json     # 小雪骨骼数据
│   ├── xiaoxue.atlas    # 小雪图集
│   └── xiaoxue.png      # 小雪纹理
├── effects/             # 特效动画
│   ├── slash.json       # 斩击特效
│   ├── slash.atlas
│   ├── slash.png
│   ├── bite.json        # 撕咬特效
│   ├── heal.json        # 治愈特效
│   └── ...
└── enemies/             # 敌人动画
    ├── teddy.json
    └── ...
```

## 版本兼容

- Spine 编辑器版本：4.1+
- 运行时：@esotericsoftware/spine-pixi
- 导出设置：JSON 格式，非预乘 Alpha

## 使用方式

资源放置后，通过 `SpineCanvas` 组件加载：

```jsx
<SpineCanvas
  spineData={{
    skeleton: '/spine/characters/xiaoxue.json',
    atlas: '/spine/characters/xiaoxue.atlas',
  }}
  animation="idle"
  loop={true}
/>
```

## 注意事项

- 文件路径区分大小写
- 纹理图片建议 2 的幂次方尺寸（如 1024x1024）
- 单个纹理不要超过 2048x2048 以兼容移动端
- atlas 文件中的图片路径应为相对路径
