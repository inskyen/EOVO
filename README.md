# EOVO · 地球原影

> 一衹小蝴蝶游荡过的维度足迹。
> Earth's Original Visual Observer.

**[eovo.org](https://eovo.org)**

---

## 是什么

EOVO 是一个场景卡片档案馆。

有一衹小蝴蝶，它游荡在所有维度、所有时空、所有世界之间。它没有目的地，只是飞到哪里，觉得有意思，就停下来，把看见的瞬间记录成一张卡片，然后飞走。

这些卡片，是它的足迹。

每一张卡片不是一个故事，而是一个**舞台**——一个可以发生无数故事的地方。用户选择一个舞台，选择其中的一个瞬间，把生成的 Prompt 发给自己的 AI，由 AI 继续演绎。

EOVO 不生成故事，它提供**舞台与开场**。

---

## 核心结构

```
Scene（舞台）
↓
Moment（瞬间片段）
↓
Prompt 生成
↓
用户发给 AI 演绎
```

---

## 坐标系

每一张场景卡片，对应蝴蝶在维度地图上的一个坐标点。

| 轴 | 标识 | 说明 | 示例值 |
|---|---|---|---|
| 时间轴 | AXIS-T | 卡片发生的时代 | 神话时代 / 冷战 / 2000s / 近未来 / 星际时代 |
| 空间轴 | AXIS-S | 卡片所在的空间 | 村落 / 都市 / 战场 / 异星 / 梦境 / 概念空间 |
| 文明轴 | AXIS-C | 卡片所属的文明背景 | 东亚 / 欧洲 / 架空东方 / 机械文明 / 后人类 |
| 质感轴 | AXIS-Q | 卡片的氛围与情绪 | 日常温柔 / 压抑 / 史诗 / 荒诞 / 神圣 / 虚无 |

---

## 数据结构

```json
{
  "scene_id": "FMVQWNv",
  "name": "夜之城·霓虹暗巷",
  "world": "赛博朋克 2077",
  "description": "雨水顺着生锈的管道滴落，远处的全息广告牌闪烁着幽蓝的光。这里是法外狂徒交换情报的隐秘角落，永远藏着致命的交易。",
  "characters": ["V", "强尼·银手", "群星"],
  "tags": ["近未来", "都市", "架空西方", "压抑"],
  "coords": {
    "time": "近未来",
    "space": "都市",
    "civ": "架空西方",
    "tone": "压抑"
  },
  "narrative": "instant",
  "moments": [
    {
      "title": "中间人的致命委托",
      "opening": "一辆纯黑色的浮空车在巷口悬停，车窗降下，递出了一个沾着血迹的数据芯片。"
    }
  ]
}
```

### `narrative` 叙事类型（仅用于 AI 生成，不展示）

| 值 | 说明 | 类比 |
|---|---|---|
| `instant` | 瞬间剪影，1个moment | 战场无名士兵 |
| `resident` | 驻场流转，多个独立moment | 武林外传、春晚 |
| `lifetime` | 跟人一生，有成长弧光 | 阿甘正传 |
| `epic` | 跨代史诗，几百上千年 | 百年孤独 |
| `loop` | 循环日常，无终点 | 生活大爆炸 |
| `fragment` | 残影碎片，信息不完整 | 罗生门视角 |

---

## 技术栈

```
Next.js + TypeScript
Supabase（数据库 + 认证）
Vercel（部署）
```

---

## 项目结构

```
EOVO/
├── app/
│   ├── scene/[id]/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ArchiveZone.tsx
│   ├── DrawZone.tsx
│   ├── SceneCard.tsx
│   ├── SceneDrawer.tsx
│   └── SearchZone.tsx
├── lib/
├── public/
│   ├── data/
│   │   └── scenes.json
│   └── og-image.png
└── scripts/
```

---

## 开发阶段

当前处于 **MVP 阶段**。

已完成：场景卡数据结构、动态路由、场景详情页、Moment Prompt 复制、坐标系设计、Supabase 接入。

进行中：AI 批量生成场景卡数据、坐标轴筛选、搜索功能。

目标：收录 **20,000+** 张场景卡，覆盖人类文明所有维度的叙事瞬间。

---

## License

MIT