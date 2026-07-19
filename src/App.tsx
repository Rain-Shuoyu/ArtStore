import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { artworks, gallery } from './gallery-data'

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>
}

function MenuIcon() {
  return <span className="menu-icon" aria-hidden="true"><i /><i /></span>
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <header className="site-header">
      <div className="header-main shell">
        <Link to="/" className="wordmark" aria-label={`${gallery.name} home`}>
          <span>YG</span>
          <strong>{gallery.name}</strong>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link to="/">Works</Link>
          <a href="#about">About</a>
          <a href="#contact">Visit</a>
        </nav>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
          <MenuIcon />
        </button>
      </div>
      <div className={`mobile-menu${menuOpen ? ' is-open' : ''}`} id="mobile-menu">
        <Link to="/">Works</Link>
        <a href="#about">About</a>
        <a href="#contact">Visit</a>
      </div>
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

function ArtworkPlaceholder({ sequence, ratio, large = false }: { sequence: string, ratio: string, large?: boolean }) {
  return (
    <div className={`artwork-placeholder${large ? ' artwork-placeholder-large' : ''}`} style={{ aspectRatio: ratio }}>
      <span className="placeholder-index">{sequence}</span>
      <span className="placeholder-mark">Artwork image<br />to be added</span>
    </div>
  )
}

function ArtworkCard({ artwork }: { artwork: typeof artworks[number] }) {
  return (
    <article className="artwork-card">
      <Link to={`/artwork/${artwork.id}`} className="artwork-image-link" aria-label={`View ${artwork.title} by ${artwork.artist}`}>
        <ArtworkPlaceholder sequence={artwork.sequence} ratio={artwork.ratio} />
      </Link>
      <div className="artwork-caption">
        <div>
          <p>{artwork.artist}</p>
          <p><em>{artwork.title}</em>, {artwork.year}</p>
        </div>
        <Link className="view-work" to={`/artwork/${artwork.id}`} aria-label={`View work ${artwork.sequence}`}>View <span>→</span></Link>
      </div>
    </article>
  )
}

function HomePage() {
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
            <p><span className="work-count">{String(artworks.length).padStart(2, '0')}</span> Selected works</p>
            <div className="work-controls">
              <button type="button">All works <span>⌄</span></button>
              <button type="button">Available <span>⌄</span></button>
            </div>
          </div>
          <div className="shell artwork-grid">
            {artworks.map((artwork) => <ArtworkCard artwork={artwork} key={artwork.id} />)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function ArtworkDetailPage() {
  const { id } = useParams()
  const artwork = artworks.find((work) => work.id === id) ?? artworks[0]
  const [enquirySent, setEnquirySent] = useState(false)

  return (
    <>
      <main className="detail-page">
        <div className="shell back-row">
          <Link to="/">← All works</Link>
          <span>Work {artwork.sequence} / {String(artworks.length).padStart(2, '0')}</span>
        </div>
        <section className="shell detail-layout">
          <div className="detail-image">
            <ArtworkPlaceholder sequence={artwork.sequence} ratio={artwork.ratio} large />
          </div>
          <aside className="detail-panel">
            <p className="eyebrow">{artwork.availability === 'available' ? 'Available work' : 'On hold'}</p>
            <h1>{artwork.artist}</h1>
            <p className="detail-title"><em>{artwork.title}</em>, {artwork.year}</p>
            <dl>
              <div><dt>Medium</dt><dd>{artwork.medium}</dd></div>
              <div><dt>Dimensions</dt><dd>{artwork.dimensions}</dd></div>
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
          <Link to={`/artwork/${artworks[(artworks.indexOf(artwork) + 1) % artworks.length].id}`}>
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
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/artwork/:id" element={<ArtworkDetailPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  )
}
