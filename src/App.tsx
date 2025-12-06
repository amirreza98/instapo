import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Profile from './Profile/Profile';
import Explore from './Explore/Explore.tsx'; 
import Messages from './Messages/Messages.tsx'; 
import Game from './Game/Game';
import AI from './AI/AI';

function App() {
  return (
    <BrowserRouter>
      {/* 🚀 ساختار کلی برنامه: یک نوار کناری و یک محتوای اصلی */}
      <div className='flex flex-row h-screen w-screen overflow-x-hidden'>
        
        <Navbar />
        <main className='flex-1 p-5 overflow-y-auto'> 
          <Routes>
            
            <Route path="/" element={<Profile />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/AI" element={<AI />} />
            <Route path="/Game" element={<Game />} />
            <Route path="/messages" element={<Messages />} />
            
            <Route path="*" element={<h1>404: Page Not Found</h1>} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}

export default App