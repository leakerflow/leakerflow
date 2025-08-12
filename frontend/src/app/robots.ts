import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Disallow sensitive or non-indexable API endpoints (adjust as needed)
        '/api/',
        '/auth/',
        '/monitoring/',
      ],
    },
    sitemap: `${siteConfig.url}sitemap.xml`,
    host: siteConfig.url.replace(/\/$/, ''),
  };
}
