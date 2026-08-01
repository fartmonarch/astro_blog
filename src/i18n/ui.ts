export const languages = {
  zh: '中文',
  en: 'English',
};

export const defaultLang = 'zh';

export const ui = {
  zh: {
    'nav.home': '首页',
    'nav.about': '关于',
    'nav.archive': '归档',
    'nav.tags': '标签',
    'home.title': '简约不是缺失，而是深度',
    'home.subtitle': '一个极简 Astro 博客主题，剥离干扰，拉近作者与读者的距离。',
    'archive.title': '全部文章',
    'archive.description': '过去到现在所有的思考与笔记。',
    'post.publishedOn': '发布时间：',
    'post.updatedOn': '最后更新：',
    'toc.title': '目录',
    'tags.title': '标签',
    'tags.description': '按主题探索文章。',
    'tags.postsCount': '篇',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.archive': 'Archive',
    'nav.tags': 'Tags',
    'home.title': 'Simplicity is Depth, Not Lack',
    'home.subtitle': 'A minimal Astro blog theme, free from distractions.',
    'archive.title': 'All Posts',
    'archive.description': 'Thoughts and notes from past to present.',
    'post.publishedOn': 'Published on:',
    'post.updatedOn': 'Updated on:',
    'toc.title': 'Contents',
    'tags.title': 'Tags',
    'tags.description': 'Explore posts by topics.',
    'tags.postsCount': 'posts',
  },
} as const;