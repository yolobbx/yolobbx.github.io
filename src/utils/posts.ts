import type { CollectionEntry } from 'astro:content';

// 从文章 id 中提取 URL slug：
// - 去掉 /index 后缀（folder/index.md 结构）
// - 去掉日期前缀（如 2024-06-22-），保持 URL 简洁
export function getPostSlug(post: CollectionEntry<'posts'>): string {
  return post.id
    .replace(/\/index$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '');
}
