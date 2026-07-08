# 内容发布转换方案

目标：用一份 Markdown 作为唯一内容源，同时稳定输出到微信公众号和小红书。

## 总体结构

整个流程分三层：

1. Markdown Source
2. Intermediate Model
3. Platform Renderers
   - WeChat Renderer
   - Xiaohongshu Renderer

核心原则：公众号和小红书都不直接从 Markdown 渲染，先进入中间模型。

## 输入层：Markdown 约定

Markdown 只负责表达内容，不负责平台样式。

建议支持这些基础元素：

- `# / ## / ###` 标题
- 段落
- 无序列表 / 有序列表
- 引用
- 加粗 / 斜体
- 代码块
- 图片
- 链接

建议约束：

- 不写复杂表格
- 不依赖 HTML 嵌套样式
- 不写平台专用语法
- 图片尽量带说明文本
- 文章结构清晰，方便后面拆页

## 中间内容模型

建议分成两层模型。

### 1. Document Model

忠实表示文章结构，主要来自 Markdown AST。

```json
{
  "type": "document",
  "title": "",
  "blocks": []
}
```

`blocks` 可包含：

- heading
- paragraph
- list
- quote
- code
- image
- link
- divider

这一层负责把 Markdown 变成结构化内容。

### 2. Presentation Model

面向平台输出，重点是语义和排版意图。

```json
{
  "title": "",
  "subtitle": "",
  "summary": "",
  "sections": [
    {
      "heading": "",
      "bullets": [],
      "paragraphs": [],
      "callout": ""
    }
  ],
  "quotes": [],
  "images": [],
  "tags": [],
  "cta": ""
}
```

这一层负责把文章整理成适合发布的内容单元。

## 公众号输出方案

公众号不支持原生 Markdown，输出目标应是：

- 可复制到公众号编辑器的 HTML / 富文本
- 结构清爽，尽量保留原文层级

### 输出规则

- 标题映射为公众号标题样式
- 段落保留段落
- 列表保留列表
- 引用保留引用块
- 加粗保留加粗
- 图片保留图片
- 代码块尽量简化为等宽文本块或纯文本

### 输出特点

- 不追求花哨视觉
- 少用复杂 CSS
- 不依赖 JS
- 少做跨平台不稳定样式

### 输出格式

建议统一输出两种：

1. `html`
2. `plain text preview`

用途分别是：

- HTML 用于粘贴进公众号编辑器
- preview 用于后台预览校验

## 小红书输出方案

小红书不做整篇文章搬运，而做内容卡片化。

### 输出目标

- 一组竖版图片页
- 一份笔记文案
- 一组标签

### 页面结构建议

每篇文章拆成：

- 封面页
- 3 到 7 页正文卡片
- 结尾总结页

总页数建议：

- 5 到 9 页
- 内容更长时宁可拆系列，不要一篇塞太满

### 每页规则

- 一页只表达一个主题
- 标题短，尽量 12 到 18 个字内
- 正文 2 到 4 行
- 留白充分
- 强调少而准
- 视觉统一，避免装饰过载

### 输出格式

建议输出：

1. `cover image`
2. `page images[]`
3. `caption`
4. `tags[]`

## 推荐转换链路

```text
Markdown
  -> Markdown AST
  -> Document Model
  -> Presentation Model
  -> WeChat Renderer / Xiaohongshu Renderer
```

不要直接走：

```text
Markdown -> 微信输出
Markdown -> 小红书输出
```

直接转会让逻辑越来越散，后面改一次规则要改多处。

## 渲染器职责边界

### WeChat Renderer

职责：

- 保持文章结构
- 输出公众号富文本 / HTML
- 保证兼容性

不负责：

- 文章重写
- 内容压缩
- 视觉大改造

### Xiaohongshu Renderer

职责：

- 文章内容重组
- 信息压缩
- 分页
- 生成竖版图文

不负责：

- 忠实保留原文逐段结构
- 把长文完整搬进一张图里

## 最小可行 schema

如果先做最小版本，建议先定成这样：

```json
{
  "title": "string",
  "summary": "string",
  "sections": [
    {
      "heading": "string",
      "bullets": ["string"],
      "paragraphs": ["string"]
    }
  ],
  "tags": ["string"],
  "images": [
    {
      "src": "string",
      "alt": "string"
    }
  ]
}
```

这套足够支撑：

- 公众号富文本输出
- 小红书卡片分页输出

## 实现顺序

建议按这个顺序做：

1. 定 Markdown 语法约定
2. 定 AST 到中间模型的映射
3. 定公众号 renderer
4. 定小红书分页规则
5. 定小红书视觉模板
6. 再做代码实现

## 结论

这套方案的本质是：

- Markdown 作为唯一内容源
- 中间模型作为统一语义层
- 公众号和小红书各自独立渲染

公众号可以尽量保守，重点是稳定输出。
小红书要把“内容编辑”放在“格式转换”前面，这样才会真的好读。
