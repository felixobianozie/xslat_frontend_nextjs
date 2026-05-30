/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https:www.lutheranhighschool.ng",
  generateRobotsTxt: true, // generates robots.txt too
  generateIndexSitemap: false, // set true for large sites (1000s of pages)
  // sitemapSize: 7000,          // split into multiple files if needed
  exclude: ["/dashboard", "/test-page"], // pages to exclude
  changefreq: "daily",
  priority: 0.7,

  // For dealing with dynamic routes
  //   additionalPaths: async (config) => {
  //     // Fetch your dynamic routes here
  //     const posts = await fetch("https://api.example.com/posts").then((r) =>
  //       r.json(),
  //     );

  //     return posts.map((post) => ({
  //       loc: `/blog/${post.slug}`,
  //       changefreq: "weekly",
  //       priority: 0.8,
  //       lastmod: post.updatedAt,
  //     }));
  //   },
};
