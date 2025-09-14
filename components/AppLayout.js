import React from 'react'
import { useRouter } from 'next/router'
import { useWallet } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'

// Динамический импорт кнопки кошелька без SSR для избежания ошибок гидратации
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
)

export default function AppLayout({ children }) {
  const router = useRouter()
  const { publicKey } = useWallet()

  const isActive = (path) => {
    if (path === '/') {
      return router.pathname === '/' && !router.query.category
    }
    if (path === '/create') {
      return router.query.create === '1'
    }
    if (path === '/my-prompts') {
      return router.query.view === 'my'
    }
    // Для AI моделей проверяем параметр category
    const categoryName = path.replace('/', '')
    return router.query.category === categoryName
  }

  return (
    <div className="layout">
      {/* New Horizontal Top Navigation */}
      <header className="top-navigation">
        <div className="nav-left">
          <button 
            className="brand-link"
            onClick={() => router.push('/?reset=1')}
          >
            <img 
              src="/icons/Logopromptraise.png" 
              alt="Prompt Raise" 
              className="logo" 
              onError={(e) => {
                e.currentTarget.src = '/icons/prompthublogo.png'
              }} 
            />
          </button>
        </div>

        <div className="nav-center">
          <div className="nav-models">
            <button 
              className={`nav-link ${isActive('/gpt') ? 'active' : ''}`}
              onClick={() => router.push('/?category=gpt')}
            >
              <img src="/icons/chatlogo.png" alt="GPT" className="nav-icon" />
              <span>GPT</span>
            </button>
            <button 
              className={`nav-link ${isActive('/claude') ? 'active' : ''}`}
              onClick={() => router.push('/?category=claude')}
            >
              <img src="/icons/claudelogo.png" alt="Claude" className="nav-icon" />
              <span>Claude</span>
            </button>
            <button 
              className={`nav-link ${isActive('/grok') ? 'active' : ''}`}
              onClick={() => router.push('/?category=grok')}
            >
              <img src="/icons/groklogo.png" alt="Grok" className="nav-icon" />
              <span>Grok</span>
            </button>
            <button 
              className={`nav-link ${isActive('/deepseek') ? 'active' : ''}`}
              onClick={() => router.push('/?category=deepseek')}
            >
              <img src="/icons/DeepSeek_logo_.png" alt="DeepSeek Logo" className="nav-icon" />
              <span>DeepSeek</span>
            </button>
            <button 
              className={`nav-link ${isActive('/copilot') ? 'active' : ''}`}
              onClick={() => router.push('/?category=copilot')}
            >
              <img src="/icons/github_copilot_icon.png" alt="Copilot" className="nav-icon" />
              <span>Copilot</span>
            </button>
            <button 
              className={`nav-link ${isActive('/cursor') ? 'active' : ''}`}
              onClick={() => router.push('/?category=cursor')}
            >
              <img src="/icons/cursorlogo.png" alt="Cursor" className="nav-icon" />
              <span>Cursor</span>
            </button>
          </div>
        </div>

        <div className="nav-right">
          <div className="nav-actions">
            <button 
              className={`nav-action ${isActive('/create') ? 'active' : ''}`}
              onClick={() => router.push('/?create=1')}
            >
              <span className="nav-icon plus-icon">+</span>
              <span>Create</span>
            </button>
            <button 
              className={`nav-action ${isActive('/my-prompts') ? 'active' : ''}`}
              onClick={() => router.push('/?view=my')}
            >
              <span className="nav-icon star-icon">★</span>
              <span>My Prompts</span>
            </button>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
