# yolobbx.github.io

个人博客：**AI · Tools · Music**。基于 [Astro](https://astro.build/) 构建，部署在 GitHub Pages。

线上地址：<https://yolobbx.github.io>

---

## 技术栈

- **框架**：Astro 5（静态站点生成）
- **样式**：SCSS（CSS 变量 + 设计 token）
- **内容**：Markdown（`src/content/posts/*.md`）+ Astro Content Collections
- **部署**：GitHub Actions → GitHub Pages
- **字体**：Switzer（正文）+ JetBrains Mono（meta）+ Noto Sans SC（中文）

## 本地开发

```bash
npm install        # 首次安装依赖
npm run dev        # 启动开发服务器（http://localhost:4321）
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

每次 `git push` 到 `main` 分支会自动触发 GitHub Actions 构建并部署，约 1 分钟生效。

---

## 目录结构

```
yolobbx.github.io/
├── .github/workflows/
│   └── deploy.yml             # GitHub Pages 自动部署
├── public/                    # 静态资源（原样复制到站点根目录）
│   ├── images/                # 文章插图、头像、favicon
│   ├── music/                 # 音乐 mp3 文件
│   └── music/covers/          # 专辑封面图（后续放）
├── src/
│   ├── components/            # 可复用组件
│   │   ├── Nav.astro          # 顶部导航 + 主题切换
│   │   ├── Footer.astro       # 页脚 + 不蒜子访客统计
│   │   └── PostList.astro     # 文章列表组件
│   ├── content/
│   │   └── posts/             # 所有博客文章 (.md)
│   ├── content.config.ts      # 文章 frontmatter schema
│   ├── data/
│   │   └── tracks.ts          # 音乐播放列表数据
│   ├── layouts/
│   │   ├── BaseLayout.astro   # 全站基础布局（head + nav + footer）
│   │   └── PostLayout.astro   # 文章页布局
│   ├── pages/                 # 路由（文件即路由）
│   │   ├── index.astro        # 首页 /
│   │   ├── ai.astro           # /ai/
│   │   ├── tools.astro        # /tools/
│   │   ├── music.astro        # /music/
│   │   ├── about.astro        # /about/
│   │   ├── rss.xml.ts         # /rss.xml
│   │   └── posts/[...slug].astro  # /posts/<slug>/
│   ├── styles/
│   │   ├── _tokens.scss       # 设计 token（间距、字号、断点）
│   │   └── global.scss        # 全站样式
│   └── config.ts              # 站点配置（标题、导航、分类文案）
├── astro.config.mjs           # Astro 配置
├── package.json
└── tsconfig.json
```

---

## 日常维护

### 改静态文字

| 想改什么 | 文件 |
| --- | --- |
| 站点标题 / 副标题 / 作者 / footer 文字 | `src/config.ts` 的 `site` |
| GitHub / 邮箱链接 | `src/config.ts` 的 `site.links` |
| 顶部导航项 | `src/config.ts` 的 `navigation` |
| 三个分类的标题和介绍 | `src/config.ts` 的 `categories` |
| 首页大标题和介绍段 | `src/pages/index.astro`（`.hero` 区块） |
| AI/Tools/Music 页面顶部介绍 | `src/config.ts` 的 `categories.<key>.blurb` |
| About 页全部内容 | `src/pages/about.astro` |

### 写新文章

在 `src/content/posts/` 新建 `xxx.md`，文件名就是 URL slug（例如 `my-post.md` → `/posts/my-post/`）。

frontmatter 模板：

```markdown
---
title: "文章标题"
date: 2026-05-28
author: yolobbx
category: ai          # 必须是 ai | tools | music 之一
description: "一句话描述，用于 SEO 和文章列表"
draft: false          # 设 true 不会发布
---

正文内容（标准 Markdown）。

![图片说明](/images/your-image.png)
```

文章里的图片放进 `public/images/`，引用路径 `/images/xxx.png`。

### 加音乐

**步骤 1：放 mp3 文件**

把音乐文件复制到 `public/music/` 目录下，文件名建议用 `艺术家 - 歌曲名.mp3` 格式：

```
public/music/
├── Colaps - Moments Away.mp3
├── KBA - Soon Again.mp3
└── ...
```

**步骤 2：放专辑封面（可选）**

把封面图放进 `public/music/covers/`，建议方形 JPG/PNG，500×500 左右即可：

```
public/music/covers/
├── moments-away.jpg
├── soon-again.jpg
└── ...
```

> **能否自动解析 mp3 自带的专辑图？** 技术上可以（mp3 的 ID3v2 `APIC` 帧），但需要 prebuild 脚本提取并写盘，依赖多且封面通常分辨率不佳。歌不多的情况下手动放图更省心。

**步骤 3：登记到播放列表**

编辑 `src/data/tracks.ts`：

```ts
export const tracks: Track[] = [
  {
    artist: 'Colaps',
    title:  'Moments Away',
    src:    '/music/Colaps - Moments Away.mp3',
    cover:  '/music/covers/moments-away.jpg',  // 可选
  },
  // ...
];
```

没填 `cover` 时会显示一个带 ♪ 符号的占位框，可以后续再补。

### 改主题色 / 间距

`src/styles/_tokens.scss` 定义字号、间距、容器宽度、断点。

`src/styles/global.scss` 顶部 `:root` 和 `[data-theme="dark"]` 块定义亮/暗两套配色，`--accent` 是主强调色（默认砖红 `#B84A2D`）。

---

## 部署说明

仓库根目录有 `.github/workflows/deploy.yml`，触发条件是 push 到 `main` 或在 Actions 页面手动触发。

**首次部署前必须做一次**：仓库 **Settings → Pages → Build and deployment → Source** 选择 **「GitHub Actions」**（不是 "Deploy from a branch"）。

部署状态：<https://github.com/yolobbx/yolobbx.github.io/actions>

---

## 一些设计决定

- **不用 React/Vue**：纯 Astro 组件够用，零运行时 JS，加载快。
- **不蒜子访客统计**：仅在线上域名生效，本地或预览环境数据为空属正常。要去掉就删 `src/components/Footer.astro` 里 `busuanzi` 相关的 span 和最下方的 `<script>`。
- **暗色模式**：通过 `<html data-theme="dark">` 切换，偏好存在 localStorage。
- **RSS**：自动生成在 `/rss.xml`，订阅链接在 footer。
