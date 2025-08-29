import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// Динамический импорт кнопки кошелька без SSR
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
)

export default function Home() {
  const router = useRouter()
  
  // Check if user should see welcome page
  useEffect(() => {
    let welcomeSeen = false
    try {
      welcomeSeen = localStorage.getItem('welcomeSeen') === '1'
    } catch {}
    
    if (!welcomeSeen) {
      router.replace('/welcome')
      return
    }
  }, [router])

  // Shared filter options used for both search filters and create form tags
  const FILTER_SECTIONS = {
    'Purpose': [
      'Code Generation',
      'Code Review',
      'Debugging',
      'Documentation',
      'Testing',
      'Writing',
      'Translation',
      'Content Creation',
      'Teaching'
    ],
    'Type': ['System Prompt', 'Chat', 'Few-Shot', 'Function Call', 'Chain'],
    'Task': [
      'Refactoring',
      'Architecture',
      'Analysis',
      'Optimization',
      'Security',
      'Interview',
      'Coaching',
      'Debate',
      'Review',
      'Visualization'
    ],
    'Domains': [
      'Business',
      'Marketing',
      'Design',
      'Education',
      'Everyday Tasks',
      'Technology',
      'Programming',
      'Blockchain',
      'Travel',
      'Entertainment',
      'Health',
      'Finance',
      'Food',
      'Automotive',
      'Language',
      'Music',
      'Social Media'
    ]
  }

  const [prompts, setPrompts] = useState([])
  const [allPrompts, setAllPrompts] = useState([]) // Все промпты загружаем один раз
  const [loading, setLoading] = useState(true) // Индикатор загрузки
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priceSol, setPriceSol] = useState('0')
  const { publicKey, sendTransaction } = useWallet()
  const category = router.query.category || ''
  const [filtersSelected, setFiltersSelected] = useState([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [showFilters, setShowFilters] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [paidOnly, setPaidOnly] = useState(false)
  const [showMy, setShowMy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [activePrompt, setActivePrompt] = useState(null)
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState('idle') // idle | pending | success | error
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [newModel, setNewModel] = useState(category || '')
  const [newTags, setNewTags] = useState([]) // tags chosen from available filters
  const [favorites, setFavorites] = useState(new Set()) // Set of prompt IDs
  const [purchasedLocal, setPurchasedLocal] = useState(new Set()) // locally persisted purchases per viewer
  const filtersDropdownRef = useRef(null) // Reference to filters dropdown
  const SPECIAL_FILTERS = ['vibe coding']
  function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // (likes removed)

  const modelIconMap = {
    gpt: { src: '/icons/chatlogo.png', alt: 'GPT' },
    grok: { src: '/icons/groklogo.png', alt: 'Grok' },
    claude: { src: '/icons/claudelogo.png', alt: 'Claude' },
  deepseek: { src: '/icons/DeepSeek_logo_.png', alt: 'DeepSeek Logo' },
  copilot: { src: '/icons/github_copilot_icon.png', alt: 'Copilot' },
    cursor: { src: '/icons/cursorlogo.png', alt: 'Cursor' }
  }

  // Open Create dialog if query has ?create=1
  useEffect(() => {
    // First-time welcome gate
    try {
      if (typeof window !== 'undefined') {
        const seen = localStorage.getItem('welcomeSeen')
        if (!seen) {
          router.replace('/welcome')
        }
      }
    } catch {}

    if (router.query.create === '1') {
      setShowCreate(true)
  setNewModel(category || '')
    }
  }, [router.query.create])

  // Toggle My view via router query (?view=my)
  useEffect(() => {
    setShowMy(router.query.view === 'my')
  }, [router.query.view])

  // Reset all filters when the layout brand is clicked (router query contains reset=1)
  useEffect(() => {
    if (router.query.reset === '1') {
      setFiltersSelected([])
      setSearch('')
      setFreeOnly(false)
      setPaidOnly(false)
      setShowMy(false)
      setShowCreate(false)
      // Clean the URL by removing reset and any other transient flags
      const q = { ...router.query }
      delete q.reset
      delete q.view
      delete q.create
      delete q.category
      router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true })
    }
  }, [router.query.reset])

  // Load favorites from localStorage when wallet changes
  useEffect(() => {
    const viewer = publicKey ? publicKey.toBase58() : 'local'
    try {
      const raw = localStorage.getItem(`favorites:${viewer}`)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setFavorites(new Set(arr))
        else setFavorites(new Set())
      } else {
        setFavorites(new Set())
      }
    } catch { setFavorites(new Set()) }
  }, [publicKey])

  // Load locally persisted purchases for the viewer
  useEffect(() => {
    const viewer = publicKey ? publicKey.toBase58() : 'local'
    try {
      const raw = localStorage.getItem(`purchased:${viewer}`)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setPurchasedLocal(new Set(arr))
        else setPurchasedLocal(new Set())
      } else setPurchasedLocal(new Set())
    } catch { setPurchasedLocal(new Set()) }
  }, [publicKey])

  // Close filters dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filtersDropdownRef.current && !filtersDropdownRef.current.contains(event.target)) {
        setShowFilters(false)
      }
    }

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showFilters])

  function savePurchased(next) {
    if (!publicKey) return
    const viewer = publicKey ? publicKey.toBase58() : 'local'
    try { localStorage.setItem(`purchased:${viewer}`, JSON.stringify(Array.from(next))) } catch {}
  }

  function saveFavorites(next) {
    if (!publicKey) return
    const viewer = publicKey ? publicKey.toBase58() : 'local'
    try {
      localStorage.setItem(`favorites:${viewer}`, JSON.stringify(Array.from(next)))
    } catch {}
  }

  function toggleFavorite(id) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveFavorites(next)
      return next
    })
  }

  // (toggleLike removed)

  function isPurchasedByViewer(p) {
    const viewer = publicKey ? publicKey.toBase58() : ''
    if (!viewer) return false
    if (p.owner === viewer) return true
    if (Array.isArray(p.buyers) && p.buyers.includes(viewer)) return true
    if (purchasedLocal && purchasedLocal.has && purchasedLocal.has(p.id)) return true
    return false
  }

  function canAccessContent(prompt) {
    if (!prompt) return false
    if (prompt.priceSol <= 0) return true // Free prompts
    return isPurchasedByViewer(prompt)
  }

  // Загружаем ВСЕ промпты только один раз
  useEffect(() => {
    const loadAllPrompts = async () => {
      setLoading(true);
      try {
        const headers = publicKey ? { 'x-viewer': publicKey.toBase58() } : {};
        const response = await fetch('/api/prompts', { headers });
        if (response.ok) {
          const data = await response.json();
          setAllPrompts(data); // Сохраняем ВСЕ промпты
        }
      } catch (error) {
        console.error('Error loading prompts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllPrompts();
  }, [publicKey]); // Только при смене кошелька

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [category, filtersSelected, freeOnly, paidOnly, search]);

  // Мгновенная фильтрация на клиенте - без API запросов!
  const filteredPrompts = useMemo(() => {
    return allPrompts.filter(prompt => {
      // Фильтр по категории
      const matchesCategory = !category || category === 'all' || prompt.category === category;
      
      // Фильтр по поиску
      const matchesSearch = !search.trim() || (
        prompt.title?.toLowerCase().includes(search.toLowerCase()) ||
        prompt.content?.toLowerCase().includes(search.toLowerCase()) ||
        prompt.author?.toLowerCase().includes(search.toLowerCase()) ||
        (Array.isArray(prompt.filters) && prompt.filters.some(filter => 
          filter.toLowerCase().includes(search.toLowerCase())
        ))
      );
      
      // Фильтр по выбранным фильтрам
      const matchesFilters = filtersSelected.length === 0 || 
        filtersSelected.some(filter => prompt.filters?.includes(filter));
      
      // Фильтр по цене
      const matchesPrice = (!freeOnly && !paidOnly) || 
        (freeOnly && prompt.priceSol === 0) ||
        (paidOnly && prompt.priceSol > 0);
      
      return matchesCategory && matchesSearch && matchesFilters && matchesPrice;
    });
  }, [allPrompts, category, search, filtersSelected, freeOnly, paidOnly]);

  // Применяем шафл только для главной страницы
  const shuffledPrompts = useMemo(() => {
    return !category ? shuffle([...filteredPrompts]) : filteredPrompts;
  }, [filteredPrompts, category]);

  // Pagination logic
  const totalPages = Math.ceil(shuffledPrompts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPrompts = shuffledPrompts.slice(startIndex, endIndex)

  async function createPrompt(e) {
    e.preventDefault()
  // Persist exactly the chosen tags from available filters
  const filters = (Array.isArray(newTags) ? newTags : []).filter(Boolean)
    const chosenModel = newModel || category || null
    const body = { title, content, priceSol: parseFloat(priceSol || '0'), category: chosenModel, filters }
    const res = await fetch('/api/prompts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-owner': publicKey ? publicKey.toBase58() : '' }, body: JSON.stringify(body) })
    const created = await res.json()
    setPrompts(p => [created, ...p])
    setTitle('')
    setContent('')
    setPriceSol('0')
  setNewTags([])
    setNewModel('')
    setShowCreate(false)
    // remove ?create flag from URL after creating
    const q = { ...router.query }; delete q.create;
    router.push({ pathname: router.pathname, query: q }, undefined, { shallow: true })
  }

  function closeCreateModal() {
    setShowCreate(false)
    const q = { ...router.query }; delete q.create;
    router.push({ pathname: router.pathname, query: q }, undefined, { shallow: true })
  }

  async function openPrompt(id) {
    try {
      setLoadingPrompt(true)
      const data = await (await fetch(`/api/prompts?id=${id}`, { headers: { 'x-viewer': publicKey ? publicKey.toBase58() : '' } })).json()
      setActivePrompt(data)
    } finally {
      setLoadingPrompt(false)
    }
  }

  function closePrompt() {
    setActivePrompt(null)
  setPurchaseStatus('idle')
  setPurchaseMessage('')
  }

  async function copyPrompt() {
    if (!activePrompt) return
    try {
      await navigator.clipboard.writeText(activePrompt.content || '')
      // optional: could add a toast later
    } catch {}
  }

  async function buyActivePrompt() {
    if (!activePrompt) return
    if (!publicKey) {
      setPurchaseStatus('error')
      setPurchaseMessage('Connect wallet to buy')
      return
    }
    if (activePrompt.priceSol <= 0) {
      setPurchaseStatus('error')
      setPurchaseMessage('This prompt is free')
      return
    }

    setPurchaseStatus('pending')
    setPurchaseMessage('Processing payment...')

    try {
      const web3 = await import('@solana/web3.js')
      const connection = new web3.Connection(web3.clusterApiUrl('devnet'))
      let recipient
      try {
        recipient = new web3.PublicKey(activePrompt.owner)
      } catch (e) {
        setPurchaseStatus('error')
        setPurchaseMessage('Invalid seller address')
        return
      }
      const lamports = Math.round(activePrompt.priceSol * 1e9)
      const tx = new web3.Transaction().add(
        web3.SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipient, lamports })
      )
      const signature = await sendTransaction(tx, connection)

      const viewer = publicKey.toBase58()
      
      // Immediately mark as purchased locally for instant access
      setPurchasedLocal(prev => {
        const next = new Set(prev)
        next.add(activePrompt.id)
        savePurchased(next)
        return next
      })

      // Fetch full prompt content immediately after payment
      try {
        // First try immediately
        let fullPrompt = await fetch(`/api/prompts?id=${activePrompt.id}`, { 
          headers: { 'x-viewer': viewer }
        }).then(r => r.json())
        
        // If no content yet, try again after short delay
        if (!fullPrompt.content && fullPrompt.priceSol > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
          fullPrompt = await fetch(`/api/prompts?id=${activePrompt.id}`, { 
            headers: { 'x-viewer': viewer }
          }).then(r => r.json())
        }
        
        if (fullPrompt) {
          setActivePrompt({
            ...fullPrompt,
            buyers: [...(fullPrompt.buyers || []), viewer],
            locked: false
          })
        } else {
          // Fallback: update current prompt with buyer info
          setActivePrompt(prev => ({
            ...prev,
            buyers: [...(prev.buyers || []), viewer],
            locked: false
          }))
        }
      } catch (error) {
        console.error('Failed to fetch full prompt:', error)
        // Fallback: update current prompt with buyer info
        setActivePrompt(prev => ({
          ...prev,
          buyers: [...(prev.buyers || []), viewer],
          locked: false
        }))
      }

      setPurchaseStatus('success')
      setPurchaseMessage('Payment successful! Prompt unlocked.')

      // Force refresh the prompt data after a short delay to ensure we get the updated content
      setTimeout(async () => {
        try {
          const refreshedPrompt = await fetch(`/api/prompts?id=${activePrompt.id}`, { 
            headers: { 'x-viewer': viewer }
          }).then(r => r.json())
          
          if (refreshedPrompt) {
            setActivePrompt(refreshedPrompt)
          }
        } catch (error) {
          console.error('Failed to refresh prompt after purchase:', error)
        }
      }, 1000)

      // Verify in background (no blocking)
      verifyPurchaseInBackground(signature, activePrompt.id, viewer)
      
    } catch (err) {
      console.error(err)
      setPurchaseStatus('error')
      setPurchaseMessage('Payment failed: ' + (err?.message || 'unknown error'))
    }
  }

  async function verifyPurchaseInBackground(signature, promptId, buyer) {
    try {
      const verifyResp = await fetch('/api/prompts/verify-purchase', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promptId, signature, buyer })
      })
      
      if (verifyResp.ok) {
        const result = await verifyResp.json()
        
        // Update active prompt if it matches
        if (activePrompt && activePrompt.id === promptId && result.prompt) {
          setActivePrompt(result.prompt)
        }
        
        // Update prompts list with full content
        if (result.prompt) {
          setPrompts(prev => prev.map(p => {
            if (p.id === promptId) {
              return result.prompt
            }
            return p
          }))
        }
        
        // Refresh the entire prompts list to ensure purchased prompt shows up properly
        refreshPromptsList()
      } else {
        console.warn('Purchase verification failed, but content remains accessible')
      }
    } catch (error) {
      console.warn('Background verification failed:', error)
    }
  }

  async function refreshPromptsList() {
    try {
      const q = category ? `?category=${category}` : ''
      const f = filtersSelected.length ? `&filters=${filtersSelected.join(',')}` : ''
      const priceParams = []
      if (freeOnly) priceParams.push('free')
      if (paidOnly) priceParams.push('paid')
      const p = priceParams.length ? `&price=${priceParams.join(',')}` : ''
      
      const refreshedList = await fetch(`/api/prompts${q}${f}${p}`, { 
        headers: { 'x-viewer': publicKey ? publicKey.toBase58() : '' }
      }).then(r => r.json())
      
      if (Array.isArray(refreshedList)) {
        setPrompts(refreshedList)
      }
    } catch (err) {
      console.error('Failed to refresh prompts list:', err)
    }
  }

  return (
    <div className="main-container">
      <div className="header-row">
        <div className="header">
          <h1 style={{margin: 0}}>Prompt Marketplace</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0}}>
            Discover and share AI prompts
          </p>
        </div>
        <div className="header-wallet">
          <div className="social-links">
            <a href="#" className="social-link" title="X (Twitter)">
              <img src="/icons/x-logo.svg" alt="X" className="social-icon" />
            </a>
            <a href="#" className="social-link" title="DexScreener">
              <img src="/icons/dex-screener-seeklogo.svg" alt="DexScreener" className="social-icon" />
            </a>
          </div>
          <WalletMultiButton />
        </div>
      </div>

      <section className="list">
        <div className="controls" style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <input 
            className="search"
            placeholder="Search prompts..." 
            value={search} 
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1); // Сброс на первую страницу при поиске
            }}
            style={{flex:'1 1 auto'}}
          />
          {/* My Prompts button now lives in the sidebar under Create Prompt */}
        </div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
          <div className="filters-dropdown" ref={filtersDropdownRef}>
            <button onClick={() => setShowFilters(!showFilters)}>
              <span>Filters</span>
              {(filtersSelected.length > 0 || freeOnly || paidOnly) && 
                <span style={{
                  marginLeft: '8px', 
                  background: 'var(--primary)', 
                  color: 'var(--bg)', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px'
                }}>
                  {filtersSelected.length + (freeOnly ? 1 : 0) + (paidOnly ? 1 : 0)}
                </span>
              }
            </button>
          
          {showFilters && (
            <div className="filters-content">
              <div className="filter-section">
                <div className="filter-options">
                  {SPECIAL_FILTERS.map(f => (
                    <button key={f}
                      className={`filter-chip ${filtersSelected.includes(f) ? 'active' : ''}`}
                      onClick={() => setFiltersSelected(s => s.includes(f) ? s.filter(x=>x!==f) : [...s, f])}
                    ><span>{f}</span></button>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <div className="filter-options">
                  {FILTER_SECTIONS['Purpose'].map(f => (
                    <button key={f} 
                      className={`filter-chip ${filtersSelected.includes(f) ? 'active' : ''}`}
                      onClick={() => setFiltersSelected(s => s.includes(f) ? s.filter(x=>x!==f) : [...s, f])}
                    ><span>{f}</span></button>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-options">
                  {FILTER_SECTIONS['Type'].map(f => (
                    <button key={f} 
                      className={`filter-chip ${filtersSelected.includes(f) ? 'active' : ''}`}
                      onClick={() => setFiltersSelected(s => s.includes(f) ? s.filter(x=>x!==f) : [...s, f])}
                    ><span>{f}</span></button>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-options">
                  {FILTER_SECTIONS['Task'].map(f => (
                    <button key={f} 
                      className={`filter-chip ${filtersSelected.includes(f) ? 'active' : ''}`}
                      onClick={() => setFiltersSelected(s => s.includes(f) ? s.filter(x=>x!==f) : [...s, f])}
                    ><span>{f}</span></button>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-options">
                  {FILTER_SECTIONS['Domains'].map(f => (
                    <button key={f}
                      className={`filter-chip ${filtersSelected.includes(f) ? 'active' : ''}`}
                      onClick={() => setFiltersSelected(s => s.includes(f) ? s.filter(x=>x!==f) : [...s, f])}
                    ><span>{f}</span></button>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <h4>Price</h4>
                <div className="price-filters">
                  <div className="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="free-only"
                      checked={publicKey ? freeOnly : true}
                      onChange={e => setFreeOnly(e.target.checked)}
                    />
                    <label htmlFor="free-only">Free Only</label>
                  </div>
                  <div className="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="paid-only"
                      checked={publicKey ? paidOnly : false}
                      onChange={e => setPaidOnly(e.target.checked)}
                      disabled={!publicKey}
                    />
                    <label htmlFor="paid-only">Paid Only</label>
                  </div>
                </div>
              </div>

              {(filtersSelected.length > 0 || freeOnly || paidOnly) && (
                <button 
                  onClick={() => {setFiltersSelected([]); setFreeOnly(false); setPaidOnly(false)}}
                  style={{marginTop: '12px', width: '100%'}}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg)',
                  color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                ←
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                const isVisible = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 2 && page <= currentPage + 2);
                
                if (!isVisible) {
                  if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} style={{color: 'var(--text-muted)'}}>...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: currentPage === page ? 'var(--primary)' : 'var(--bg)',
                      color: currentPage === page ? 'var(--bg)' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      minWidth: '36px'
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg)',
                  color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
        {shuffledPrompts.length === 0 && allPrompts.length > 0 && search.trim() && (
          <div style={{textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)'}}>
            <p style={{fontSize: '1.2rem'}}>No prompts found for "{search}"</p>
            <p>Try different search terms or clear the search</p>
          </div>
        )}
        
        {shuffledPrompts.length === 0 && allPrompts.length === 0 && !loading && (
          <div style={{textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)'}}>
            <p style={{fontSize: '1.2rem'}}>No prompts found.</p>
            <p>Try adjusting your filters or create the first prompt!</p>
          </div>
        )}
        
        {loading && (
          <div style={{textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)'}}>
            <p style={{fontSize: '1.2rem'}}>Loading prompts...</p>
          </div>
        )}
        
        {/* Main grid or My sections */}
        {!showMy && !loading && (
          <div className="prompt-grid">
            {currentPrompts.map(p => {
            const viewer = publicKey ? publicKey.toBase58() : ''
            const isBuyer = viewer && (p.owner === viewer || (Array.isArray(p.buyers) && p.buyers.includes(viewer)))
            const isPurchased = viewer && p.owner !== viewer && (purchasedLocal.has(p.id) || (Array.isArray(p.buyers) && p.buyers.includes(viewer)))
            const canAccess = (p.priceSol <= 0) || isBuyer
            const raw = p.content || ''
            const locked = p.priceSol > 0 && !canAccess
            const previewBase = raw.length > 120 ? raw.substring(0, 120) + '...' : raw
            const preview = locked ? '' : previewBase
            return (
              <a key={p.id} onClick={() => openPrompt(p.id)} className="prompt-card" style={{cursor:'pointer', position:'relative'}}>
                {isPurchased && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#28a745',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}>
                    OWNED
                  </div>
                )}
                <div className="prompt-title">
                  {p.category && modelIconMap[p.category] && (
                    <img className="model-mini" src={modelIconMap[p.category].src} alt={modelIconMap[p.category].alt} />
                  )}
                  {p.title}
                </div>
                <div className={`prompt-content ${canAccess ? '' : 'blurred'}`}>{preview}</div>
                <div className="prompt-meta" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    {p.author && p.author.trim() && p.author.trim().toLowerCase() !== 'anonymous' ? (
                      <div className="prompt-author">By {p.author.trim()}</div>
                    ) : null}
                    <div className="prompt-price">
                      {p.priceSol > 0 ? (
                        <>
                          <span className="amount">{p.priceSol}</span>
                          <img className="sol-inline" src="/icons/solana.svg" alt="Solana" />
                        </>
                      ) : (
                        <span className="free-label">Free</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'inline-flex', gap:8, alignItems:'center' }}>
                    <button
                      aria-label={favorites.has(p.id) ? 'Remove from My Prompts' : 'Add to My Prompts'}
                      title={favorites.has(p.id) ? 'Remove from My Prompts' : 'Add to My Prompts'}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (publicKey) toggleFavorite(p.id) }}
                      disabled={!publicKey}
                      style={{ background:'transparent', border:'none', color: favorites.has(p.id) ? 'gold' : 'var(--text-muted)', fontSize:'18px', cursor:'pointer', padding:0 }}
                    >{favorites.has(p.id) ? '★' : '☆'}</button>
                  </div>
                </div>
              </a>
             )
           })}
         </div>
        )}

        {showMy && (() => {
          const viewer = publicKey ? publicKey.toBase58() : ''
          const createdBase = viewer ? filteredPrompts.filter(p => p.owner === viewer) : []
          const purchasedBase = viewer ? filteredPrompts.filter(p => p.owner !== viewer && ((Array.isArray(p.buyers) && p.buyers.includes(viewer)) || (purchasedLocal && purchasedLocal.has && purchasedLocal.has(p.id)))) : []
          const favsBase = filteredPrompts.filter(p => favorites.has(p.id) && !createdBase.some(c=>c.id===p.id) && !purchasedBase.some(c=>c.id===p.id))

          // likes removed; keep original order
          const created = createdBase
          const purchased = purchasedBase
          const favs = favsBase

          const Section = ({ title, items }) => (
            <section style={{marginBottom:'20px'}}>
              <h3 style={{margin:'8px 4px'}}>{title} ({items.length})</h3>
              {items.length === 0 ? (
                <div style={{color:'var(--muted)', padding:'8px 4px'}}>No prompts</div>
              ) : (
                <div className="prompt-grid">
                  {items.map(p => {
                    const canAccess = canAccessContent(p)
                    const isPurchased = isPurchasedByViewer(p) && p.owner !== viewer
                    const raw = p.content || ''
                    const preview = canAccess ? (raw.length > 120 ? raw.substring(0, 120) + '...' : raw) : ''
                    return (
                      <a key={p.id} onClick={() => openPrompt(p.id)} className="prompt-card" style={{cursor:'pointer', position:'relative'}}>
                        {isPurchased && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#28a745',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}>
                            OWNED
                          </div>
                        )}
                        <div className="prompt-title">
                          {p.category && modelIconMap[p.category] && (
                            <img className="model-mini" src={modelIconMap[p.category].src} alt={modelIconMap[p.category].alt} />
                          )}
                          {p.title}
                        </div>
                        <div className={`prompt-content ${canAccess ? '' : 'blurred'}`}>{preview}</div>
                        <div className="prompt-meta" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                          <div style={{display:'flex', alignItems:'center', gap:10}}>
                            {p.author && p.author.trim() && p.author.trim().toLowerCase() !== 'anonymous' ? (
                              <div className="prompt-author">By {p.author.trim()}</div>
                            ) : null}
                            <div className="prompt-price">
                              {p.priceSol > 0 ? (
                                <>
                                  <span className="amount">{p.priceSol}</span>
                                  <img className="sol-inline" src="/icons/solana.svg" alt="Solana" />
                                </>
                              ) : (
                                <span className="free-label">Free</span>
                              )}
                            </div>
                          </div>
                          <div style={{ display:'inline-flex', gap:8, alignItems:'center' }}>
                            <button
                              aria-label={favorites.has(p.id) ? 'Remove from My Prompts' : 'Add to My Prompts'}
                              title={favorites.has(p.id) ? 'Remove from My Prompts' : 'Add to My Prompts'}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (publicKey) toggleFavorite(p.id) }}
                              disabled={!publicKey}
                              style={{ background:'transparent', border:'none', color: favorites.has(p.id) ? 'gold' : 'var(--text-muted)', fontSize:'18px', cursor:'pointer', padding:0 }}
                            >{favorites.has(p.id) ? '★' : '☆'}</button>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </section>
          )

          return (
            <div>
              <Section title="Created by me" items={created} />
              <Section title="Purchased" items={purchased} />
              <Section title="Favorites" items={favs} />
            </div>
          )
        })()}
      </section>

      {showCreate && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Prompt</h2>
            <form id="new-prompt-form" onSubmit={createPrompt}>
              <div className="form-group">
                <label htmlFor="model">Model</label>
                <select 
                  id="model"
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                >
                  <option value="">Select model</option>
                  <option value="gpt">GPT</option>
                  <option value="grok">Grok</option>
                  <option value="claude">Claude</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="copilot">Copilot</option>
                  <option value="cursor">Cursor</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input 
                  id="title"
                  placeholder="Enter prompt title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="content">Prompt Content</label>
                <textarea 
                  id="content"
                  placeholder="Enter your prompt content here..." 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">
                  Price
                  <img className="sol-badge" src="/icons/solana.svg" alt="Solana" />{' '}(optional)
                </label>
                <input 
                  id="price"
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="0 for free" 
                  value={priceSol} 
                  onChange={e => setPriceSol(e.target.value)} 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="filters">Tags</label>
                {/* Use the same filter chips as search to pick tags for the prompt */}
                <div id="filters">
                  {/* Special filters first */}
                  <div className="filter-section">
                    <div className="filter-options">
                      {SPECIAL_FILTERS.map(f => (
                        <button
                          type="button"
                          key={f}
                          className={`filter-chip ${newTags.includes(f) ? 'active' : ''}`}
                          onClick={() => setNewTags(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f])}
                        >
                          <span>{f}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Regular filter sections */}
                  {Object.entries(FILTER_SECTIONS).map(([section, options]) => (
                    <div className="filter-section" key={section}>
                      <div className="filter-options">
                        {options.map(f => (
                          <button
                            type="button"
                            key={f}
                            className={`filter-chip ${newTags.includes(f) ? 'active' : ''}`}
                            onClick={() => setNewTags(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f])}
                          >
                            <span>{f}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="button-group">
                <button type="button" className="button-secondary" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!publicKey}
                  className={publicKey ? 'btn-primary' : ''}
                >
                  {publicKey ? 'Create Prompt' : 'Connect Wallet'}
                </button>
              </div>
            </form>
            {!publicKey && (
              <p style={{
                marginTop: '16px', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}>
                Connect your wallet to create prompts
              </p>
            )}
          </div>
        </div>
  )}

      {activePrompt && (
        <div className="modal-overlay" onClick={closePrompt}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{marginTop:0, display:'flex', alignItems:'center', gap:'8px', position:'relative'}}>
              {(() => {
                const isPurchased = isPurchasedByViewer(activePrompt) && activePrompt.owner !== (publicKey ? publicKey.toBase58() : '')
                return isPurchased && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '0px',
                    background: '#28a745',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}>
                    OWNED
                  </div>
                )
              })()}
              {activePrompt.category && modelIconMap[activePrompt.category] && (
                <img className="model-mini" src={modelIconMap[activePrompt.category].src} alt={modelIconMap[activePrompt.category].alt} />
              )}
              {activePrompt.title}
            </h2>
            <div className="meta" style={{marginBottom:'10px', display:'flex', alignItems:'center', gap:12}}>
    By {activePrompt.author || 'Anonymous'} · {activePrompt.priceSol > 0 ? (
                <>
                  <span className="amount">{activePrompt.priceSol}</span>
          <img className="sol-inline" src="/icons/solana.svg" alt="Solana" />
                </>
      ) : <span className="free-label">Free</span>}
              <span style={{flex:1}} />
              {/* like removed */}
            </div>
            {(() => {
              const canAccess = canAccessContent(activePrompt)
              return (
                <>
          <pre className={canAccess ? '' : 'blurred'} style={{whiteSpace:'pre-wrap'}}>{canAccess ? activePrompt.content : ''}</pre>
                  {!canAccess && (
                    <p style={{color:'var(--muted)', marginTop:'8px'}}>This is a paid prompt. Buy to reveal content.</p>
                  )}
                  <div className="button-group" style={{marginTop:'14px', display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                    {!canAccess && activePrompt.priceSol > 0 && (
                      <button onClick={buyActivePrompt} disabled={purchaseStatus === 'pending' || !publicKey}>
                        {publicKey ? (purchaseStatus === 'pending' ? 'Processing...' : `Buy for ${activePrompt.priceSol} SOL`) : 'Connect wallet to buy'}
                      </button>
                    )}
                    {canAccess && (
                      <button onClick={copyPrompt}>Copy</button>
                    )}
                    <button className="button-secondary" onClick={closePrompt}>Close</button>
                  </div>
                  {purchaseStatus !== 'idle' && (
                    <div className={`status ${purchaseStatus}`} style={{marginTop:'8px', padding:'8px', borderRadius:'6px', backgroundColor: purchaseStatus === 'success' ? '#22c55e20' : purchaseStatus === 'error' ? '#ef444420' : '#3b82f620', border: purchaseStatus === 'success' ? '1px solid #22c55e40' : purchaseStatus === 'error' ? '1px solid #ef444440' : '1px solid #3b82f640'}}>
                      {purchaseStatus === 'success' && <span style={{color:'#22c55e'}}>✓ </span>}
                      {purchaseStatus === 'error' && <span style={{color:'#ef4444'}}>✗ </span>}
                      {purchaseStatus === 'pending' && <span style={{color:'#3b82f6'}}>⏳ </span>}
                      {purchaseMessage}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

    </div>
  )
}
