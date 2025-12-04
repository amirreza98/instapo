import React from 'react'

function Navbar() {
  return (
    <>
        <h1 className=''>Instapo</h1>
        <div className='flex flex-col gap-5'>
            <a href="#home">Home</a>
            <a href="#explore">Explore</a>
            <a href="#massage">Messages</a>
            <a href="#profile">Profile</a>
        </div>
    </>
  )
}

export default Navbar