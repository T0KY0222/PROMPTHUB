import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'

const WalletMultiButton = dynamic(() => import('@solana/wallet-adapter-react-ui').then(m => m.WalletMultiButton), { ssr: false })

export default function Welcome() {
  const { publicKey } = useWallet()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (publicKey) {
      try { localStorage.setItem('welcomeSeen', '1') } catch {}
      router.replace('/')
    }
  }, [publicKey])

  useEffect(() => {
    // trigger simple fade/slide-in on mount
    const t = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  function skip() {
    try { localStorage.setItem('welcomeSeen', '1') } catch {}
    router.replace('/')
  }

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh'}}>
      
      <div style={{
        maxWidth: 720,
        width: '100%',
        padding: 24,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity .45s ease, transform .45s ease'
      }}>
        <h1 style={{marginTop:0, marginBottom:12, display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontWeight:700}}>Welcome to</span>
          <img src="/icons/Logopromptraise.png" alt="Prompt Raise" style={{height:72}} onError={(e)=>{ e.currentTarget.src='/icons/prompthublogo.png' }} />
        </h1>
        <p style={{color:'var(--muted)', fontSize:'1.05rem', marginTop:0}}>Raise your use of AI.</p>

        <div style={{marginTop:16, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12, padding:16}}>
          <ul style={{margin:'8px 0 0 18px', padding:0, lineHeight:1.6}}>
            <li>Search ready‑to‑use prompts for specific AI models</li>
            <li>Create and manage your own prompts</li>
            <li>Make prompts paid and sell them via the Solana network</li>
          </ul>
        </div>

        <div style={{display:'flex', gap:12, alignItems:'center', marginTop:20}}>
          <WalletMultiButton />
          <button onClick={skip} title="Skip for now"
            style={{
              background:'transparent', border:'none', padding:0,
              color:'var(--muted)', cursor:'pointer', fontSize:'0.95rem'
            }}
          >Skip for now</button>
        </div>
      </div>
    </div>
  )
}
