// Insight Cast — Shared React Components
// Exports to window: { PublicNav, AppShell, AdminShell, Footer, FinalCta, FaqAccordion }

const { useState, useEffect } = React;

const PUBLIC_LINKS = [
  { label: 'サービス', href: '../Service.html' },
  { label: '料金',     href: '../Pricing.html' },
  { label: 'キャスト', href: '../Cast.html' },
  { label: 'ブログ',   href: '../Blog.html' },
  { label: 'About',    href: '../About.html' },
];

const APP_NAV = [
  { label: 'ダッシュボード', icon: '⊡', href: 'Dashboard.html' },
  { label: '取材先一覧',     icon: '◫', href: 'Projects.html' },
  { label: 'インタビュー履歴', icon: '◎', href: 'Interviews.html' },
  { label: '記事一覧',       icon: '≡', href: 'Articles.html' },
  { label: '設定',           icon: '⚙', href: 'Settings.html' },
];

function PublicNav({ active }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className={`pub-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="pub-nav-inner">
        <a className="pub-logo" href="../Top Page.html">Insight <em>Cast</em></a>
        <div className="pub-nav-links">
          {PUBLIC_LINKS.map(l => (
            <a key={l.label} className={`pub-nav-link${active === l.label ? ' active' : ''}`} href={l.href}>{l.label}</a>
          ))}
        </div>
        <div className="flex gap-3">
          <a className="btn btn-ghost btn-sm" href="Login.html">ログイン</a>
          <a className="btn btn-primary btn-sm" href="Signup.html">無料で試す →</a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="pub-footer">
      <div className="pub-footer-in">
        <div className="f-logo">Insight Cast</div>
        <div className="f-links">
          {['プライバシーポリシー', '利用規約', '特定商取引法に基づく表記'].map(l => (
            <span key={l} className="f-link">{l}</span>
          ))}
        </div>
        <div className="f-copy">© 2026 Insight Cast</div>
      </div>
    </footer>
  );
}

function FinalCta({ title = 'まずは無料で、取材を体験してみる', sub = '登録はメールアドレスだけ。3名のキャストが今日から使えます。' }) {
  return (
    <div className="final-cta">
      <h2>{title}</h2>
      <p>{sub}</p>
      <div className="cta-actions">
        <a className="btn btn-white btn-lg" href="Signup.html">無料で取材を始める →</a>
        <a className="btn btn-ghost-white" href="../Cast.html">キャストを見る</a>
      </div>
    </div>
  );
}

function FaqAccordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="faq-list">
      {items.map((f, i) => (
        <div className="faq-item" key={i}>
          <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{f.q}</span>
            <i className={`faq-chevron${open === i ? ' open' : ''}`}>⌄</i>
          </button>
          <div className={`faq-a${open === i ? ' open' : ''}`}>
            <div className="faq-a-in">{f.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AppShell({ active, title, children, headerRight }) {
  const currentFile = window.location.pathname.split('/').pop();
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-top">
          <a className="app-sidebar-logo" href="Dashboard.html">Insight <em>Cast</em></a>
        </div>
        <nav className="app-nav">
          {APP_NAV.map(n => {
            const isActive = active === n.label || currentFile === n.href;
            return (
              <a key={n.label} className={`app-nav-link${isActive ? ' active' : ''}`} href={n.href}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{n.icon}</span>
                {n.label}
              </a>
            );
          })}
        </nav>
        <div className="app-sidebar-footer">
          <a className="app-nav-link" href="../Top Page.html" style={{ fontSize: 13 }}>
            <span>←</span> 公開サイトへ
          </a>
        </div>
      </aside>
      <main className="app-main">
        <header className="app-header">
          <div className="app-header-left">
            <span className="app-header-title">{title}</span>
          </div>
          <div className="flex gap-3 items-center">
            {headerRight}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-l)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, border: '1.5px solid var(--border)', cursor: 'pointer'
            }}>U</div>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}

function AdminShell({ active, title, children }) {
  const ADMIN_NAV = [
    { label: 'ダッシュボード', icon: '⊡', href: 'Dashboard.html' },
    { label: '記事管理',       icon: '≡', href: 'Posts.html' },
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-logo">Insight <em>Cast</em> <span style={{ fontSize: 11, opacity: .5 }}>Admin</span></div>
        </div>
        <nav className="admin-nav">
          {ADMIN_NAV.map(n => (
            <a key={n.label} className={`admin-nav-link${active === n.label ? ' active' : ''}`} href={n.href}>
              <span>{n.icon}</span>{n.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <div className="admin-header">
          <span className="font-serif font-bold" style={{ fontSize: 16 }}>{title}</span>
          <a className="btn btn-ghost btn-sm" href="../app/Dashboard.html">← アプリへ</a>
        </div>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}

Object.assign(window, { PublicNav, AppShell, AdminShell, Footer, FinalCta, FaqAccordion });
