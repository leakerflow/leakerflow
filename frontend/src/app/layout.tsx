import { ThemeProvider } from '@/components/home/theme-provider';
import { siteConfig } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import { PostHogIdentify } from '@/components/posthog-identify';
import '@/lib/polyfills'; // Load polyfills early

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: 'black',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | LeakerFlow — GTA 6`,
  },
  description:
    'LeakerFlow — GTA 6 news, leaks, mods, and guides for creators, streamers, and players. Build videos, publish news, optimize performance, and join the largest gaming community.',
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
  authors: [{ name: 'LeakerFlow', url: siteConfig.url }],
  creator: 'LeakerFlow',
  publisher: 'LeakerFlow',
  category: 'Gaming',
  applicationName: 'LeakerFlow',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'LeakerFlow — GTA 6 News, Leaks, Mods & Guides',
    description:
      'GTA 6 news, leaks, mods, performance tips, and creator resources — join LeakerFlow to build videos, publish news, and grow your audience.',
    url: siteConfig.url,
    siteName: 'LeakerFlow',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'LeakerFlow — GTA 6 News, Leaks, Mods & Guides',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeakerFlow — GTA 6 News, Leaks, Mods & Guides',
    description:
      'GTA 6 news, leaks, mods, performance tips, and creator resources — join LeakerFlow to build videos, publish news, and grow your audience.',
    creator: '@leakerflow',
    site: '@leakerflow',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'LeakerFlow — GTA 6 News, Leaks, Mods & Guides',
      },
    ],
  },
  icons: {
    icon: [{ url: '/favicon.png', sizes: 'any' }],
    shortcut: '/favicon.png',
  },
  // manifest: "/manifest.json",
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-PCHSN4M2');`}
        </Script>
        {/* JSON-LD: Organization */}
        <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'LeakerFlow',
            url: siteConfig.url,
            logo: `${siteConfig.url}favicon.png`,
            sameAs: [
              siteConfig.links.twitter,
              siteConfig.links.github,
              siteConfig.links.linkedin,
            ],
          })}
        </Script>
        {/* JSON-LD: WebSite with SearchAction (if internal search exists later it can be wired) */}
        <Script id="ld-website" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'LeakerFlow',
            url: siteConfig.url,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${siteConfig.url}search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          })}
        </Script>
        <Script async src="https://cdn.tolt.io/tolt.js" data-tolt={process.env.NEXT_PUBLIC_TOLT_REFERRAL_ID}></Script>
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PCHSN4M2"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
          <Analytics />
          <GoogleAnalytics gaId="G-6ETJFB3PT3" />
          <SpeedInsights />
          <PostHogIdentify />
        </ThemeProvider>
      </body>
    </html>
  );
}
