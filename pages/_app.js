import '../styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import React from 'react'
import Head from 'next/head'
import Layout from '../components/AppLayout.js'
import WalletProviders from '../components/WalletProviders.js'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Prompt Raise - Raise your use of AI</title>
        <meta name="description" content="Discover and purchase premium AI prompts for ChatGPT, Claude, and more" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <WalletProviders>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </WalletProviders>
    </>
  )
}
