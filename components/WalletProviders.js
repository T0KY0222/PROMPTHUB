"use client"

import React from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

export default function WalletProviders({ children }) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = 'https://dark-hardworking-bridge.solana-mainnet.quiknode.pro/326d9a4feaccfa1d9283e196753ea9727a4432f0'
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
