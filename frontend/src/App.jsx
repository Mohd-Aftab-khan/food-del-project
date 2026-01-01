import React, { useState, useContext } from 'react'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './components/Footer/Footer'
import LoginPopup from './components/LoginPopup/LoginPopup'
import MenuList from './pages/MenuList/MenuList' 
import Verify from './pages/Verify/Verify'      
import MyOrders from './pages/MyOrders/MyOrders' 
import Chatbot from './components/Chatbot/Chatbot' 
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

const App = () => {

  const [showLogin, setShowLogin] = useState(false)


  return (
    <>
    <ToastContainer /> 
    
    {showLogin ? <LoginPopup setShowLogin={setShowLogin}/> : <></>}
      
      {/* ⚠️ NAVBAR MOVED HERE FOR FULL WIDTH */}
      <Navbar setShowLogin={setShowLogin}/>
      
      <div className='app'>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/menu-list' element={<MenuList/>} /> 
          <Route path='/cart' element={<Cart setShowLogin={setShowLogin}/>} />
          <Route path='/order' element={<PlaceOrder/>}/>
          <Route path='/verify' element={<Verify/>}/>
          <Route path='/myorders' element={<MyOrders/>}/>
        </Routes>
      </div>
      
      <Chatbot />
      <Footer/>
    </>
  )
}

export default App