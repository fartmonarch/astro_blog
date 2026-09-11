import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_CONFIG } from "../config";

export async function GET(context: any) {
  const posts = await getCollection("blog");
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    site: context.site || SITE_CONFIG.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      // 只输出分类（真正用于归类的那一层）；tags 仅作站内展示
      categories: post.data.categories,
    })),
  });
}
