import { Link } from 'react-router-dom'; // 👈 استفاده از Link

function Navbar() {
  return (
    <div className='flex flex-col items-center p-5 border-r h-screen w-60'> 
        <h1 className='pb-28 text-3xl font-bold'>Instapo</h1>
        <div className='flex flex-col gap-10 text-lg'>
            <Link to="/">Profile</Link> 
            <Link to="/explore">Explore</Link>
            <Link to="/AI">AI</Link>
            <Link to="/Game">Game</Link>
            <Link to="/messages">Messages</Link> 
        </div>
    </div>
  )
}

export default Navbar