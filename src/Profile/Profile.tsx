import ProImg from '../assets/ProImg.JPEG'
import img1 from '../assets/img1.JPEG'
import img2 from '../assets/img2.JPEG'
import img3 from '../assets/img3.JPEG'
import img4 from '../assets/img4.JPEG'
import img5 from '../assets/img5.JPEG'
import img6 from '../assets/img6.JPEG'
import img7 from '../assets/img7.JPEG'
import Gallery from './components/Gallery'

function Profile() {
  return (
    <div className='flex flex-col w-full h-fit p-12 bg-blue-300'>
      
      {/* Profile Section */}
      <div className='flex flex-row justify-evenly bg-amber-300 w-full h-full'>
        {/* Profile Image */}
        <img src={ProImg} alt="Profile" className=' w-72 h-72 object-cover rounded-full'/>

        {/* Profile Info */}
        <div className='flex-col h-fit ml-10 gap-5 text-2xl bg-blue-900'>
          <div className='flex flex-row items-center mt-16 space-x-4'>
            <p className='font-bold'>Amir Reza Azemati</p>
            <button className='w-56 h-10 bg-black text-white rounded-lg'>download CV</button>
            <button className='w-56 h-10 bg-black text-white rounded-lg justify-center items-center'>Massage</button>
          </div>
          <div className='flex flex-row gap-5 mt-12'>
            <p>200 posts</p>
            <p>200 Likes</p>
            <p>200 posts</p>
          </div>
          <div className='mt-5 text-lg '>
            <p>Full Stack Engineer specializing in React, TypeScript, and Python with 5+ years of experience building scalable, production-grade
              applications. Delivered high-impact features across systems handling 5K+ daily sensor records, 500+ concurrent connections, and multi-
              tenant platforms. Strong focus on clean architecture, API design, performance improvements, and real-world product delivery</p>
          </div>
          <div className='mt-2 text-lg space-x-4 font-mono'>
            <p>Location: Berlin, Germany</p>
            <a href='https://www.linkedin.com/in/amirrezaazemati/' className='text-blue-500'>LinkedIn</a>
            <a href='https://github.com/amirreza98' className='text-blue-500'>GitHub</a>
          </div>
        </div>
      </div>
      {/* Highlights section */}
      <div className='flex flex-row bg-amber-700 w-full mt-5 h-fit overflow-x-scroll space-x-5'>
        <img src={img1} alt="Highlight1" className=' w-24 h-24 object-cover rounded-full border-4 border-pink-500'/>
        <img src={img2} alt="Highlight2" className=' w-24 h-24 object-cover rounded-full border-4 border-pink-500'/>
        <img src={img3} alt="Highlight3" className=' w-24 h-24 object-cover rounded-full border-4 border-pink-500'/> 
        <img src={img4} alt="Highlight4" className=' w-24 h-24 object-cover rounded-full border-4 border-pink-500'/>
        <img src={img5} alt="Highlight5" className=' w-24 h-24 object-cover rounded-full border-4 border-pink-500'/>
        <img src={img6} alt="Highlight6" className=' w-24 h-24 object-cover rounded-full border-4 border-pink-500'/>
        <img src={img7} alt="Highlight7" className=' w-24 h-24 object-cover rounded-full border-4 border-pink-500'/>
      </div>
      {/* Line */}
      <div className='border-b-2 border-gray-400 w-full mt-5'></div>
      {/* Gallery Section */}
      <div className='w-full mt-2'>
        <Gallery />
      </div>
    </div>
  )
}

export default Profile