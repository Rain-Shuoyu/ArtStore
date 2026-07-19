import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import logo from './assets/logo.png'
import { type Locale, ui } from './i18n'
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

function Header({ locale, setLocale }: { locale: Locale, setLocale: (locale: Locale) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const text = ui[locale]

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
        <Link to="/" className="wordmark" aria-label={`${gallery.name} ${text.home}`}>
          <img src={logo} alt="" />
          <strong>{gallery.name}</strong>
        </Link>
        <nav className="desktop-nav" aria-label={text.navigation}>
          <button type="button" onClick={() => navigateTo('#works')}>{text.works}</button>
          <button type="button" onClick={() => navigateTo('#about')}>{text.about}</button>
          <button type="button" onClick={() => navigateTo('#contact')}>{text.visit}</button>
        </nav>
        <div className="header-actions">
          <div className="locale-switcher" aria-label={text.language}>
            <button type="button" className={locale === 'zh' ? 'is-active' : ''} aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>中</button>
            <button type="button" className={locale === 'en' ? 'is-active' : ''} aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
          </div>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen((open) => !open)}>
            <span>{menuOpen ? text.close : text.menu}</span>
            <MenuIcon />
          </button>
        </div>
      </div>
      <nav className={`site-menu${menuOpen ? ' is-open' : ''}`} id="site-menu" aria-label={text.siteMenu}>
        <button type="button" onClick={() => navigateTo('#works')}>{text.works} <span>→</span></button>
        <button type="button" onClick={() => navigateTo('#about')}>{text.about} <span>→</span></button>
        <button type="button" onClick={() => navigateTo('#contact')}>{text.visitContact} <span>→</span></button>
      </nav>
    </header>
  )
}

function Footer({ locale }: { locale: Locale }) {
  const text = ui[locale]

  return (
    <footer className="site-footer" id="contact">
      <div className="shell footer-grid">
        <div className="footer-statement">
          <p className="eyebrow">{text.visitContactTitle}</p>
          <p className="footer-title">{text.footerStatementFirst}<br />{text.footerStatementSecond}</p>
        </div>
        <div className="footer-column">
          <p className="eyebrow">{text.contact}</p>
          <a href={`mailto:${gallery.email}`}>{gallery.email}</a>
          <a href={`https://weixin.qq.com/`} target="_blank" rel="noreferrer">WeChat · {gallery.wechat} <ArrowIcon /></a>
          <a href="https://www.xiaohongshu.com/user/profile/6a0926dc0000000002002005?xsec_token=YBwuhFeKCrlcyjXSIMdZvbIEqHr16wKKoE7YP8pjLZelQ=&xsec_source=app_share&&apptime=1784451264&shareRedId=ODhIRjpHNTw2NzUyOTgwNjc8OTlIRzo7&share_id=bbbc6e9cc8d84147b31230046315adb9&xhsshare=CopyLink" target="_blank" rel="noreferrer">{gallery.xiaohongshu} <ArrowIcon /></a>
        </div>
        <div className="footer-column">
          <p className="eyebrow">{text.gallery}</p>
          <address>{gallery.address.map((line) => <span key={line}>{line}</span>)}</address>
          <a href="#top">{text.backToTop}</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} {gallery.name}</span>
        <span>{text.subjectToAvailability}</span>
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

function ArtworkPlaceholder({ sequence, ratio, locale, large = false }: { sequence: string, ratio: string, locale: Locale, large?: boolean }) {
  const text = ui[locale]

  return (
    <div className={`artwork-visual artwork-placeholder${large ? ' artwork-visual-large' : ''}`} style={{ aspectRatio: ratio }}>
      <span className="placeholder-index">{sequence}</span>
      <span className="placeholder-mark">{text.artworkImageFirst}<br />{text.artworkImageSecond}</span>
    </div>
  )
}

function ArtworkImage({ artwork, locale, large = false }: { artwork: Artwork, locale: Locale, large?: boolean }) {
  if (!artwork.image) {
    return <ArtworkPlaceholder sequence={artwork.sequence} ratio={artwork.ratio} locale={locale} large={large} />
  }

  return (
    <div className={`artwork-visual${large ? ' artwork-visual-large' : ''}`}>
      <span className="placeholder-index">{artwork.sequence}</span>
      <img src={artwork.image} alt={`${artwork.title}${artwork.titleZh ? ` · ${artwork.titleZh}` : ''}`} loading={large ? 'eager' : 'lazy'} />
    </div>
  )
}

function ArtworkCard({ artwork, locale }: { artwork: Artwork, locale: Locale }) {
  const text = ui[locale]

  return (
    <article className="artwork-card">
      <Link to={`/artwork/${artwork.id}`} className="artwork-image-link" aria-label={`${text.viewArtwork} ${artwork.title}`}>
        <ArtworkImage artwork={artwork} locale={locale} />
      </Link>
      <div className="artwork-caption">
        <div>
          <p><em>{artwork.title}</em></p>
          {artwork.titleZh && <p>{artwork.titleZh}</p>}
          <p className="artwork-origin">{artwork.origin ?? artwork.artist}</p>
        </div>
        <Link className="view-work" to={`/artwork/${artwork.id}`} aria-label={`${text.viewArtwork} ${artwork.sequence}`}>{text.viewWork} <span>→</span></Link>
      </div>
    </article>
  )
}

function HomePage({ artworks, isLoading, loadError, locale }: { artworks: Artwork[], isLoading: boolean, loadError: boolean, locale: Locale }) {
  const [filter, setFilter] = useState<'all' | 'available'>('all')
  const text = ui[locale]
  const visibleArtworks = filter === 'available'
    ? artworks.filter((artwork) => artwork.availability === 'available')
    : artworks

  return (
    <>
      <main id="top">
        <section className="intro shell" id="about">
          <div>
            <p className="eyebrow">{text.museum}</p>
            <h1>{text.heroTitleFirst}<br />{text.heroTitleSecond}</h1>
          </div>
          <div className="intro-copy">
            <p>{text.heroCollection}</p>
            <p className="intro-services">{text.heroServices}</p>
            <a href="#works" className="text-link">{text.exploreWorks} <ArrowIcon /></a>
          </div>
        </section>

        <section className="works-section" id="works">
          <div className="works-toolbar shell">
            <p><span className="work-count">{String(visibleArtworks.length).padStart(2, '0')}</span> {filter === 'available' ? text.availableWorks : text.selectedWorks}</p>
            <div className="work-controls" aria-label={text.filterWorks}>
              <button type="button" className={filter === 'all' ? 'is-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{text.allWorks}</button>
              <button type="button" className={filter === 'available' ? 'is-active' : ''} aria-pressed={filter === 'available'} onClick={() => setFilter('available')}>{text.available}</button>
            </div>
          </div>
          <div className="shell artwork-grid" aria-busy={isLoading}>
            {visibleArtworks.map((artwork) => <ArtworkCard artwork={artwork} locale={locale} key={artwork.id} />)}
            {isLoading && <p className="collection-status">{text.loadingCollection}</p>}
            {!isLoading && loadError && <p className="collection-status">{text.collectionLoadError}</p>}
            {!isLoading && !loadError && visibleArtworks.length === 0 && <p className="collection-status">{text.noMatchingWorks}</p>}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  )
}

function ArtworkDetailPage({ artworks, isLoading, locale }: { artworks: Artwork[], isLoading: boolean, locale: Locale }) {
  const { id } = useParams()
  const artwork = artworks.find((work) => work.id === id) ?? artworks[0]
  const [enquirySent, setEnquirySent] = useState(false)
  const text = ui[locale]

  if (isLoading || !artwork) {
    return <main className="shell page-status">{text.loadingCollection}</main>
  }

  const nextArtwork = artworks[(artworks.indexOf(artwork) + 1) % artworks.length]

  return (
    <>
      <main className="detail-page">
        <div className="shell back-row">
          <Link to="/">{text.backToWorks}</Link>
          <span>{text.work} {artwork.sequence} / {String(artworks.length).padStart(2, '0')}</span>
        </div>
        <section className="shell detail-layout">
          <div className="detail-image">
            <ArtworkImage artwork={artwork} locale={locale} large />
          </div>
          <aside className="detail-panel">
            <p className="eyebrow">{artwork.availability === 'available' ? text.inStock : text.onHold}</p>
            <h1>{artwork.title}</h1>
            {artwork.titleZh && <p className="detail-title">{artwork.titleZh}</p>}
            <dl>
              {artwork.origin && <div><dt>{text.origin}</dt><dd>{artwork.origin}</dd></div>}
              <div><dt>{text.material}</dt><dd>{artwork.medium}</dd></div>
              {artwork.technique && <div><dt>{text.technique}</dt><dd>{artwork.technique}</dd></div>}
              <div><dt>{text.dimensions}</dt><dd>{artwork.dimensions}</dd></div>
            </dl>
            <div className="price-block">
              <p className="eyebrow">{text.price}</p>
              <p>{artwork.price}</p>
            </div>
            <button type="button" className="enquire-button" onClick={() => setEnquirySent(true)}>
              {enquirySent ? text.enquiryNoted : text.enquire} <span>→</span>
            </button>
            {enquirySent && <p className="form-status" role="status">{text.enquiryStatus.replace('{email}', gallery.email)}</p>}
            <p className="detail-note">{text.detailNote}</p>
          </aside>
        </section>
        <section className="shell next-work">
          <Link to={`/artwork/${nextArtwork.id}`}>
            <span className="eyebrow">{text.nextWork}</span>
            <span>{text.continueViewing} <ArrowIcon /></span>
          </Link>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  )
}

export default function App() {
  const { artworks, isLoading, loadError } = useArtworks()
  const [locale, setLocale] = useState<Locale>(() => window.localStorage.getItem('openland-locale') === 'en' ? 'en' : 'zh')

  useEffect(() => {
    window.localStorage.setItem('openland-locale', locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  return (
    <>
      <ScrollToTop />
      <Header locale={locale} setLocale={setLocale} />
      <Routes>
        <Route path="/" element={<HomePage artworks={artworks} isLoading={isLoading} loadError={loadError} locale={locale} />} />
        <Route path="/artwork/:id" element={<ArtworkDetailPage artworks={artworks} isLoading={isLoading} locale={locale} />} />
        <Route path="*" element={<HomePage artworks={artworks} isLoading={isLoading} loadError={loadError} locale={locale} />} />
      </Routes>
    </>
  )
}
