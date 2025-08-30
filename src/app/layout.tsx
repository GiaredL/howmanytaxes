import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'How Many Taxes?',
  description: 'Know your contribution.'
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
