// robots.txt (served at /robots.txt). Let crawlers index the public site and
// guides, but keep the app/admin/owner and private areas out of search results.

import { SITE_URL } from "@/lib/blog";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/owner", "/messages", "/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
