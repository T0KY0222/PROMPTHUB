import '../styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import React from 'react'
import Layout from '../components/AppLayout.js'
import WalletProviders from '../components/WalletProviders.js'

export default function App({ Component, pageProps }) {
  return (
    <WalletProviders>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WalletProviders>
  )
}
