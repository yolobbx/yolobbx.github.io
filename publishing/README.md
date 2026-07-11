# publishing/ 运营文案目录

小红书 + 公众号的发布内容都放这里，**按选题聚合**：一个选题一个文件夹，内部再分平台。
github.io 的博客正文另在 `src/content/posts/`，不要把运营文案放进那里（会被 Astro build 成博客页）。

## 每个选题的文件约定

```
publishing/<slug>/
  source.md         # 唯一内容源：核心信息、要点、可复用博客正文
  wechat.md         # 公众号成稿(可直接粘进编辑器) + 文末服务介绍/二维码
  xiaohongshu.md    # 小红书:钩子标题 + 每页文字 + caption 正文 + tags
  cards/            # 小红书竖版图(3:4)。多套视觉设计分子目录,如 cards/swiss/
```

- `<slug>`：英文/拼音短名，命令行和跨平台友好；中文选题名写在各文件开头。
- 大众排期的选题用 `NN-slug` 前缀标序（见 memory `content-roadmap-phase1`）；技术类/临时选题可不带编号。
- 图片一律留在本目录，不进 `src/content/`。

## 内容流向

`source.md`(同源) → 公众号写透(`wechat.md`) / 小红书重组分页(`xiaohongshu.md` + `cards/`)。
技术转换的完整设计见项目根 `content-publishing-plan.md`。
