import { Metadata } from 'next';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: [
    'GTA 6',
    'GTA 6 news',
    'GTA 6 leaks',
    'GTA 6 mods',
    'GTA 6 guides',
    'GTA 6 streaming',
    'GTA 6 performance',
    'Rockstar Games',
  ],
  authors: [
    {
      name: 'LeakerFlow',
      url: siteConfig.url,
    },
  ],
  creator: 'LeakerFlow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: '@leakerflow',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
