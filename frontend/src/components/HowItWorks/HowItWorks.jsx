import React from 'react'
import './HowItWorks.css'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const HowItWorks = () => {

  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className='how-it-works'>
      <div className="how-it-works-header">
          <h2>Simple 3-Step Process</h2>
          <p className='how-it-works-text'>
            We made ordering food as easy as possible. Follow these simple steps and enjoy your meal in minutes.
          </p>
      </div>
      
      <div className="how-it-works-list">
          
          {/* STEP 1 */}
          <div className="how-it-works-item" onClick={() => navigate('/menu-list')}>
              <span className="step-number">01</span>
              <img src={assets.selector_icon || "https://cdn-icons-png.flaticon.com/512/3081/3081069.png"} alt="" /> 
              <h3>Select Menu</h3>
              <p>Browse our extensive menu and choose your favorite dishes.</p>
              <button className="action-btn">View Menu ➜</button>
          </div>

          {/* STEP 2 */}
          <div className="how-it-works-item" onClick={() => scrollToSection('app-download')}>
               <span className="step-number">02</span>
               <img src={assets.delivery_icon || "https://cdn-icons-png.flaticon.com/512/2979/2979685.png"} alt="" /> 
              <h3>Fast Delivery</h3>
              <p>Our delivery partner will be at your door in approx 30 mins.</p>
              <button className="action-btn">Get App ➜</button>
          </div>

          {/* STEP 3 */}
          <div className="how-it-works-item" onClick={() => scrollToSection('food-display')}>
               <span className="step-number">03</span>
               <img src={assets.quality_icon || "https://cdn-icons-png.flaticon.com/512/1147/1147832.png"} alt="" /> 
              <h3>Enjoy Food</h3>
              <p>Enjoy the high-quality, hot, and fresh meal with your family.</p>
              <button className="action-btn">Order Now ➜</button>
          </div>

      </div>
    </div>
  )
}

export default HowItWorks