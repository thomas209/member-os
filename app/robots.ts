import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/cuenta", "/checkout", "/receipt"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
