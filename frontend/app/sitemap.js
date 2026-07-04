// Sitemap for search engines (served at /sitemap.xml). Lists the public pages and
// every guide so crawlers can discover and index them.

import { ARTICLES, SITE_URL } from "@/lib/blog";

export default function sitemap() {
  const now = new Date();

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "daily" },
    { path: "/properties", priority: 0.9, changeFrequency: "daily" },
    { path: "/roommates", priority: 0.8, changeFrequency: "daily" },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/login", priority: 0.3, changeFrequency: "yearly" },
    { path: "/signup", priority: 0.3, changeFrequency: "yearly" },
  ].map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const posts = ARTICLES.map((a) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.updated),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...posts];
}
