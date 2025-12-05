import ProImg from '../assets/ProImg.JPEG'

function Profile() {
  return (
    <div className='flex justify-center'>
      <div className='flex flex-row rounded-full mt-20 ml-20 '>
        <img src={ProImg} alt="Profile" className=' w-72 h-72 object-cover rounded-full'/>
        <p>Amir Reza Azemati</p>
        <button className='w-fit h-10 ml-10 bg-blue-500 text-white px-4 py-2 rounded-lg'>download CV</button>
        <button className='w-fit h-10 ml-10 bg-blue-500 text-white px-4 py-2 rounded-lg justify-center items-center'>Massage</button>
      </div>
    </div>
  )
}

export default Profile