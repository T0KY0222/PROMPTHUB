import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon - ваша оранжевая иконка */}
        <link rel="icon" type="image/png" href="/icons/favicon.png" />
        <link rel="shortcut icon" href="/icons/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/favicon.png" />
        
        {/* Meta теги для лучшего SEO */}
        <meta name="theme-color" content="#ff8c00" />
        <meta name="description" content="PromptHub - AI prompts marketplace for GPT, Claude, Copilot and more" />
        <meta name="keywords" content="AI prompts, GPT, Claude, Copilot, marketplace, artificial intelligence" />
        
        {/* Open Graph для соцсетей */}
        <meta property="og:title" content="PromptHub" />
        <meta property="og:description" content="AI prompts marketplace for GPT, Claude, Copilot and more" />
        <meta property="og:image" content="/icons/favicon.png" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="PromptHub" />
        <meta name="twitter:description" content="AI prompts marketplace" />
        <meta name="twitter:image" content="/icons/favicon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
