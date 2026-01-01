import React from 'react'
import './Header.css'
// 1. Import useNavigate
import { useNavigate } from 'react-router-dom';

const Header = () => {
  // 2. Initialize hook
  const navigate = useNavigate();

  return (
    <div className='header'>
        <div className="header-contents">
        <h2>Order your favourite food here</h2>
        <p>Choose from a diverse menu featuring a delectable array of dishes crafted with the finest ingredients and culinary expertise. our mission is to satisfy your cravings and elevate your dining experience, one delicious meal at a time.</p>
        
        {/* 3. Update button onclick */}
        <button onClick={() => navigate('/menu-list')}>View Menu</button>
      </div>
    </div>
  )
}

export default Header