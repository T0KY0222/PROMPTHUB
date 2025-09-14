import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon - разные размеры для лучшего качества */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/icons/favicon.png" />
        <link rel="shortcut icon" href="/icons/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/favicon.png" />
        
        {/* Meta теги для лучшего SEO */}
        <meta name="theme-color" content="#ff8c00" />
  {/* Updated branding */}
  <meta name="description" content="Prompt Raise - AI prompts marketplace for GPT, Claude, Copilot, Cursor, Grok, DeepSeek and more" />
        <meta name="keywords" content="AI prompts, GPT, Claude, Copilot, marketplace, artificial intelligence" />
        
        {/* Phantom Wallet Security and Verification */}
        <meta name="dapp-verification" content="phantom-verified" />
  <meta name="application-name" content="Prompt Raise" />
        <meta name="solana-dapp" content="true" />
        <meta name="wallet-security" content="optimized" />
        
        {/* Open Graph для соцсетей */}
  <meta property="og:title" content="Prompt Raise" />
  <meta property="og:description" content="AI prompts marketplace for GPT, Claude, Copilot, Cursor, Grok, DeepSeek and more" />
  <meta property="og:image" content="/icons/Logopromptraise.png" />
  <meta property="og:site_name" content="Prompt Raise" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Prompt Raise" />
  <meta name="twitter:description" content="AI prompts marketplace" />
  <meta name="twitter:image" content="/icons/Logopromptraise.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
