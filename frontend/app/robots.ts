import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/settings/', '/profile/'],
    },
    sitemap: 'https://platform.example.com/sitemap.xml',
  };
}
