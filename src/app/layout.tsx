import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'How Many Taxes?',
  description:
    'Independent estimate of how federal taxes map to government programs. Not tax advice. Not affiliated with the IRS or U.S. government.',
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://use.typekit.net/lrn7jph.css" />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-6GGGZWK19P"></Script>
        <Script id="google-analytics">
          {`  window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-6GGGZWK19P');`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
