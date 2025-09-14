import '../styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import React from 'react'
import Head from 'next/head'
import Layout from '../components/AppLayout.js'
import WalletProviders from '../components/WalletProviders.js'

export default function App({ Component, pageProps }) {
  const siteName = 'Prompt Raise'
  const title = 'Prompt Raise – Raise your use of AI'
  const description = 'Premium curated prompts for GPT, Claude, Grok, DeepSeek, Copilot & more. Buy & sell high‑quality AI prompts.'
  const url = 'https://promptraise.xyz'
  const image = '/icons/Logopromptraise.png'

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta property="og:image:alt" content="Prompt Raise Logo" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Head>
      <WalletProviders>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </WalletProviders>
    </>
  )
}
