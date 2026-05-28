export const site = {
  title: 'yolobbx',
  description:
    "Field notes on AI research, tools, and music — by yolobbx, an AI grad student working on action recognition.",
  author: 'yolobbx',
  url: 'https://yolobbx.github.io',
  footerText: '© 2024–2026 yolobbx',
  links: {
    github: 'yolobbx',
    email: '2534856393@qq.com',
  },
} as const;

export const navigation = [
  { name: 'Home',  href: '/' },
  { name: 'AI',    href: '/ai/' },
  { name: 'Tools', href: '/tools/' },
  { name: 'Music', href: '/music/' },
  { name: 'About', href: '/about/' },
] as const;

export type Category = 'ai' | 'tools' | 'music';

export const categories: Record<Category, { title: string; blurb: string; eyebrow: string }> = {
  ai: {
    title: 'AI',
    eyebrow: '01 · AI',
    blurb:
      "聚焦人工智能领域内容，涵盖机器学习、深度学习、大模型与智能 Agent 相关实践，同时记录行为识别方向的科研思考、学习心得与研究思路",
  },
  tools: {
    title: 'Tools',
    eyebrow: '02 · TOOLS',
    blurb: "分享各类实用工具的使用技巧、配置教程，包括效率工具、云服务、中转服务等相关内容，梳理实操经验，助力提升日常使用与工作效率",
  },
  music: {
    title: 'Music',
    eyebrow: '03 · MUSIC',
    blurb:
      "收录音乐相关内容，包含 Beatbox、DJ 文化、乐理知识、钢琴演奏以及编曲创作等方面的学习记录与心得分享",
  },
};
