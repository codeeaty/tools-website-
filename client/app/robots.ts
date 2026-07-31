import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // This hides your dashboard and any sub-pages like /dashboard/settings
      disallow: ['/dashboard/', '/api/'], 
    },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}