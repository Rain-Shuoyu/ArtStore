import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { mapArtworkRecord, seedArtworks, type Artwork, type ArtworkRecord, gallery } from './gallery-data'
import { isSupabaseConfigured, supabase } from './supabase'

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>
}

function MenuIcon() {
  return <span className="menu-icon" aria-hidden="true"><i /><i /></span>
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView())
      return
    }

    window.scrollTo({ top: 0, left: 0 })
  }, [hash, pathname])

  return null
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash])

  const navigateTo = (hash: '#about' | '#contact' | '#works') => {
    if (location.pathname === '/') {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/${hash}`)
    }
  }

  return (
    <header className="site-header">
      <div className="header-main shell">
        <Link to="/" className="wordmark" aria-label={`${gallery.name} home`}>
          <span>YG</span>
          <strong>{gallery.name}</strong>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button type="button" onClick={() => navigateTo('#works')}>Works</button>
          <button type="button" onClick={() => navigateTo('#about')}>About</button>
          <button type="button" onClick={() => navigateTo('#contact')}>Visit</button>
        </nav>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen((open) => !open)}>
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
          <MenuIcon />
        </button>
      </div>
      <nav className={`site-menu${menuOpen ? ' is-open' : ''}`} id="site-menu" aria-label="Site menu">
        <button type="button" onClick={() => navigateTo('#works')}>Works <span>→</span></button>
        <button type="button" onClick={() => navigateTo('#about')}>About <span>→</span></button>
        <button type="button" onClick={() => navigateTo('#contact')}>Visit / Contact <span>→</span></button>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="shell footer-grid">
        <div className="footer-statement">
          <p className="eyebrow">Visit / Contact</p>
          <p className="footer-title">Art worth spending<br />time with.</p>
        </div>
        <div className="footer-column">
          <p className="eyebrow">Contact</p>
          <a href={`mailto:${gallery.email}`}>{gallery.email}</a>
          <a href={`https://weixin.qq.com/`} target="_blank" rel="noreferrer">WeChat · {gallery.wechat} <ArrowIcon /></a>
          <a href="https://www.xiaohongshu.com/" target="_blank" rel="noreferrer">Xiaohongshu · {gallery.xiaohongshu} <ArrowIcon /></a>
        </div>
        <div className="footer-column">
          <p className="eyebrow">Gallery</p>
          <address>{gallery.address.map((line) => <span key={line}>{line}</span>)}</address>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} {gallery.name}</span>
        <span>All works are subject to availability.</span>
      </div>
    </footer>
  )
}

function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>(seedArtworks)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let isCurrent = true

    supabase
      .from('artworks')
      .select('id, inventory_number, title, title_zh, origin, material, technique, dimensions, price, inventory_status, image_url, sort_order')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!isCurrent) return

        if (error) {
          setLoadError(true)
        } else {
          setArtworks((data as ArtworkRecord[]).map(mapArtworkRecord))
        }
        setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return { artworks, isLoading, loadError }
}

function ArtworkPlaceholder({ sequence, ratio, large = false }: { sequence: string, ratio: string, large?: boolean }) {
  return (
    <div className={`artwork-visual artwork-placeholder${large ? ' artwork-visual-large' : ''}`} style={{ aspectRatio: ratio }}>
      <span className="placeholder-index">{sequence}</span>
      <span className="placeholder-mark">Artwork image<br />to be added</span>
    </div>
  )
}

function ArtworkImage({ artwork, large = false }: { artwork: Artwork, large?: boolean }) {
  if (!artwork.image) {
    return <ArtworkPlaceholder sequence={artwork.sequence} ratio={artwork.ratio} large={large} />
  }

  return (
    <div className={`artwork-visual${large ? ' artwork-visual-large' : ''}`}>
      <span className="placeholder-index">{artwork.sequence}</span>
      <img src={artwork.image} alt={`${artwork.title}${artwork.titleZh ? ` · ${artwork.titleZh}` : ''}`} loading={large ? 'eager' : 'lazy'} />
    </div>
  )
}

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <article className="artwork-card">
      <Link to={`/artwork/${artwork.id}`} className="artwork-image-link" aria-label={`View ${artwork.title}`}>
        <ArtworkImage artwork={artwork} />
      </Link>
      <div className="artwork-caption">
        <div>
          <p><em>{artwork.title}</em></p>
          {artwork.titleZh && <p>{artwork.titleZh}</p>}
          <p className="artwork-origin">{artwork.origin ?? artwork.artist}</p>
        </div>
        <Link className="view-work" to={`/artwork/${artwork.id}`} aria-label={`View work ${artwork.sequence}`}>View <span>→</span></Link>
      </div>
    </article>
  )
}

function HomePage({ artworks, isLoading, loadError }: { artworks: Artwork[], isLoading: boolean, loadError: boolean }) {
  const [filter, setFilter] = useState<'all' | 'available'>('all')
  const visibleArtworks = filter === 'available'
    ? artworks.filter((artwork) => artwork.availability === 'available')
    : artworks

  return (
    <>
      <main id="top">
        <section className="intro shell" id="about">
          <div>
            <p className="eyebrow">Online exhibition / 2026</p>
            <h1>Works that ask<br />you to look twice.</h1>
          </div>
          <div className="intro-copy">
            <p>{gallery.name} presents a considered selection of contemporary art. The collection is updated as works become available.</p>
            <a href="#works" className="text-link">Explore the works <ArrowIcon /></a>
          </div>
        </section>

        <section className="works-section" id="works">
          <div className="works-toolbar shell">
            <p><span className="work-count">{String(visibleArtworks.length).padStart(2, '0')}</span> {filter === 'available' ? 'Available works' : 'Selected works'}</p>
            <div className="work-controls" aria-label="Filter works">
              <button type="button" className={filter === 'all' ? 'is-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All works</button>
              <button type="button" className={filter === 'available' ? 'is-active' : ''} aria-pressed={filter === 'available'} onClick={() => setFilter('available')}>Available</button>
            </div>
          </div>
          <div className="shell artwork-grid" aria-busy={isLoading}>
            {visibleArtworks.map((artwork) => <ArtworkCard artwork={artwork} key={artwork.id} />)}
            {isLoading && <p className="collection-status">Loading collection…</p>}
            {!isLoading && loadError && <p className="collection-status">The live collection could not be loaded. Showing the local preview instead.</p>}
            {!isLoading && !loadError && visibleArtworks.length === 0 && <p className="collection-status">No works match this filter.</p>}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function ArtworkDetailPage({ artworks, isLoading }: { artworks: Artwork[], isLoading: boolean }) {
  const { id } = useParams()
  const artwork = artworks.find((work) => work.id === id) ?? artworks[0]
  const [enquirySent, setEnquirySent] = useState(false)

  if (isLoading || !artwork) {
    return <main className="shell page-status">Loading collection…</main>
  }

  const nextArtwork = artworks[(artworks.indexOf(artwork) + 1) % artworks.length]

  return (
    <>
      <main className="detail-page">
        <div className="shell back-row">
          <Link to="/">← All works</Link>
          <span>Work {artwork.sequence} / {String(artworks.length).padStart(2, '0')}</span>
        </div>
        <section className="shell detail-layout">
          <div className="detail-image">
            <ArtworkImage artwork={artwork} large />
          </div>
          <aside className="detail-panel">
            <p className="eyebrow">{artwork.availability === 'available' ? 'In stock · 在库' : 'On hold'}</p>
            <h1>{artwork.title}</h1>
            {artwork.titleZh && <p className="detail-title">{artwork.titleZh}</p>}
            <dl>
              {artwork.origin && <div><dt>Origin · 产地</dt><dd>{artwork.origin}</dd></div>}
              <div><dt>Material · 材质</dt><dd>{artwork.medium}</dd></div>
              {artwork.technique && <div><dt>Technique · 工艺</dt><dd>{artwork.technique}</dd></div>}
              <div><dt>Dimensions · 尺寸</dt><dd>{artwork.dimensions}</dd></div>
            </dl>
            <div className="price-block">
              <p className="eyebrow">Price</p>
              <p>{artwork.price}</p>
            </div>
            <button type="button" className="enquire-button" onClick={() => setEnquirySent(true)}>
              {enquirySent ? 'Enquiry request noted' : 'Enquire about this work'} <span>→</span>
            </button>
            {enquirySent && <p className="form-status" role="status">Please contact us at {gallery.email} to complete your enquiry.</p>}
            <p className="detail-note">Shipping, collection, and payment details are available on request.</p>
          </aside>
        </section>
        <section className="shell next-work">
          <Link to={`/artwork/${nextArtwork.id}`}>
            <span className="eyebrow">Next work</span>
            <span>Continue viewing <ArrowIcon /></span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  const { artworks, isLoading, loadError } = useArtworks()

  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage artworks={artworks} isLoading={isLoading} loadError={loadError} />} />
        <Route path="/artwork/:id" element={<ArtworkDetailPage artworks={artworks} isLoading={isLoading} />} />
        <Route path="*" element={<HomePage artworks={artworks} isLoading={isLoading} loadError={loadError} />} />
      </Routes>
    </>
  )
}
