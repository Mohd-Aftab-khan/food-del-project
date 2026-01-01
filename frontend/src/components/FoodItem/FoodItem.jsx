import React, { useContext } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext';

// 1. Receive 'createdAt' as a prop
const FoodItem = ({ id, name, price, description, image, createdAt }) => {

  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);

  // 2. Add this helper function
  const isNewItem = (dateString) => {
      if (!dateString) return false;
      const createdDate = new Date(dateString);
      const today = new Date();
      
      // Calculate difference in milliseconds
      const diffTime = Math.abs(today - createdDate);
      // Convert to days
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      return diffDays <= 5; // Returns true if 5 days old or less
  };

  return (
    <div className='food-item'>
        <div className="food-item-img-container">
            {/* 3. Show Badge if New */}
            {isNewItem(createdAt) && <span className="new-badge">New</span>}
            
            <img className='food-item-image' src={url+"/images/"+image} alt="" />
            {/* ... rest of your existing code ... */}
            {!cartItems[id]
                ? <img className='add' onClick={()=>addToCart(id)} src={assets.add_icon_white} alt="" />
                : <div className='food-item-counter'>
                    <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt="" />
                    <p>{cartItems[id]}</p>
                    <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt="" />
                </div>
            }
        </div>
        <div className="food-item-info">
            <div className="food-item-name-rating">
                <p>{name}</p>
                <img src={assets.rating_starts} alt="" />
            </div>
            <p className="food-item-desc">{description}</p>
            <p className="food-item-price">Rs. {price}/-</p>
        </div>
    </div>
  )
}

export default FoodItem