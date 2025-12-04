import './Profile.css'

export default function Profile() {
  return (
    <div className="profile-root">
      <header className="profile-header">
        <button className="back">◀</button>
        <h2 className="title">username_here</h2>
        <button className="menu">☰</button>
      </header>

      <section className="profile-top">
        <div className="avatar" />
        <div className="meta">
          <div className="stats">
            <div><strong>24</strong><div className="label">posts</div></div>
            <div><strong>5.2k</strong><div className="label">followers</div></div>
            <div><strong>420</strong><div className="label">following</div></div>
          </div>
          <div className="bio">
            <div className="name">Full Name</div>
            <div className="desc">Photographer • Traveler • Coffee lover</div>
            <div className="link">example.com</div>
            <button className="edit">Edit profile</button>
          </div>
        </div>
      </section>

      <section className="highlights">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="highlight">
            <div className="h-avatar" />
            <div className="h-label">Story {i + 1}</div>
          </div>
        ))}
      </section>

      <section className="posts-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="post-tile">Post {i + 1}</div>
        ))}
      </section>
    </div>
  )
}
