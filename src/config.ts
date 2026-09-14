export const SITE_CONFIG = {
  title: "沫之白的小窝",
  description: "记录技术学习",
  url: "https://fartmonarch.xyz",
};

export const AUTHOR = {
  name: "沫之白",
  role: "开发者 | 写作者 | 思考者",
  bio: "你好，欢迎来到我的个人blog。",
  avatar: "/avatar.png",
};

export const SOCIALS = [
  { label: "Mail", href: "mailto:2639555042@qq.com", icon: "mdi:email" },
  { label: "GitHub", href: "https://github.com/fartmonarch", icon: "mdi:github" },
];

// 文章分类（受控词表）：只有这里列出的词才会生成分类页面、才会在详情页可点击。
// 新增/改名分类要同步改两处：这里 + public/admin/config.yml 里 select 字段的 options。
// 注意：分类名会直接进 URL（/tags/<分类>/），所以不要包含 "/" 或 "#"。
export const CATEGORIES = ["实习笔记","前端笔记","服务端笔记","运维笔记","电脑知识","Agent"] as const;

// 「未分类」是一个状态（frontmatter 里 categories 为空），不是分类词表的一员：
// 它只用于路由和展示，所以不放进 CATEGORIES。
export const UNCATEGORIZED = "未分类";

// ===== 项目展示 =====

// 项目状态（受控词表）：新增/改名要同步改三处——
// 这里 + src/content.config.ts（schema 直接引用本数组）+ public/admin/config.yml 里 select 的 options。
export const PROJECT_STATUSES = ["维护中", "开发中", "已归档"] as const;

// 平台标识：value 写进 frontmatter，label 用于图标的 title，icon 是 BrandIcon.astro 里的路径键。
// 三个品牌图标都内联在 src/components/BrandIcon.astro——不走 astro-icon，
// 因为它的本地图标集（src/icons/）在本项目里加载不出来，会报 `Unable to load the "local" icon set!`。
export const PROJECT_PLATFORMS = [
  { value: "github", label: "GitHub", icon: "github" },
  { value: "gitee", label: "Gitee", icon: "gitee" },
  { value: "npm", label: "npm", icon: "npm" },
] as const;

// 首页「项目」模块最多展示几条（精选优先，不足则用其余项目补齐）。
export const PROJECTS_ON_HOME = 4;
