function Navbar() {
  return (
    <div className='flex flex-col items-center p-5 border-r h-screen'>
        <h1 className='pb-28'>Instapo</h1>
        <div className='flex flex-col gap-10 text-lg'>
            <a href="#home">Home</a>
            <a href="#explore">Explore</a>
            <a href="#massage">Messages</a>
            <a href="#profile">Profile</a>
        </div>
    </div>
  )
}

export default Navbar