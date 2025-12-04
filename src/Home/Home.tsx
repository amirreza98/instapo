import './Home.css'

export default function Home() {
  return (
    <div className="insta-home">
      <header className="insta-header">
        <div className="brand">Instapo</div>
        <div className="search"> 
          <input placeholder="Search" />
        </div>
        <nav className="nav-icons">
          <span>🏠</span>
          <span>✉️</span>
          <span>➕</span>
        </nav>
      </header>

      <section className="stories">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="story">
            <div className="avatar" />
            <div className="user">user{i + 1}</div>
          </div>
        ))}
      </section>

      <main className="feed">
        {Array.from({ length: 3 }).map((_, i) => (
          <article key={i} className="post">
            <div className="post-header">
              <div className="post-avatar" />
              <div className="post-user">username_{i + 1}</div>
            </div>
            <div className="post-image" />
            <div className="post-actions">
              <span>❤️</span>
              <span>💬</span>
              <span>✈️</span>
            </div>
            <div className="post-caption">Nice photo #{i + 1}</div>
          </article>
        ))}
      </main>
    </div>
  )
}