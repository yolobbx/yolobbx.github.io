export const site = {
  title: 'Refine · Gather · Advance',
  tagline: 'by yolobbx',
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
      "Notes on research and the AI products I actually use. Action recognition is my home turf; large models and the rest of ML are what I read around it.",
  },
  tools: {
    title: 'Tools',
    eyebrow: '02 · TOOLS',
    blurb: "Setup recipes, tinkering logs, and the small utilities that make a day go faster.",
  },
  music: {
    title: 'Music',
    eyebrow: '03 · MUSIC',
    blurb:
      "What I've been listening to lately, plus longer pieces on beatbox culture.",
  },
};
