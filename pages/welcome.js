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
      {/* Social icons at top */}
      <div style={{position:'absolute', top:20, left:20, display:'flex', gap:12}}>
        <button 
          onClick={() => {/* TODO: Add X link */}}
          style={{
            background:'transparent', border:'none', padding:8, borderRadius:8,
            cursor:'pointer', transition:'all 0.2s ease', display:'flex',
            alignItems:'center', justifyContent:'center'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--surface)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <img src="/icons/x-logo.svg" alt="X (Twitter)" style={{width:24, height:24, filter:'invert(1)', opacity:0.8}} />
        </button>
        <button 
          onClick={() => {/* TODO: Add DexScreener link */}}
          style={{
            background:'transparent', border:'none', padding:8, borderRadius:8,
            cursor:'pointer', transition:'all 0.2s ease', display:'flex',
            alignItems:'center', justifyContent:'center'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--surface)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <img src="/icons/dexscreenerlogo.jpg" alt="DexScreener" style={{width:24, height:24, opacity:0.8}} />
        </button>
      </div>
      
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
          <img src="/icons/promptLOGO.png" alt="PromptHub" style={{height:72}} onError={(e)=>{ e.currentTarget.src='/icons/prompthublogo.png' }} />
        </h1>
        <p style={{color:'var(--muted)', fontSize:'1.05rem', marginTop:0}}>A marketplace to discover, create, and sell AI prompts.</p>

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
