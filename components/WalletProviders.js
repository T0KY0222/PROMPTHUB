"use client"

import React from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

export default function WalletProviders({ children }) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = 'https://api.mainnet-beta.solana.com'
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })]

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
