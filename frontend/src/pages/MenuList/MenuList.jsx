import React, { useContext } from 'react';
import './MenuList.css';
import { assets, menu_list } from '../../assets/assets'; 
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const MenuList = () => {
  const { food_list, cartItems, addToCart, removeFromCart, getTotalCartAmount, url, searchQuery } = useContext(StoreContext);
  const navigate = useNavigate();

  const uniqueItemsCount = Object.keys(cartItems).filter(itemId => cartItems[itemId] > 0).length;
  const isBulkMode = uniqueItemsCount > 1; 

  const handleSingleBuy = (itemId) => {
    if (!cartItems[itemId]) {
        addToCart(itemId);
    }
    navigate('/order');
  };

  // ⚡ 1. SMART FILTER FUNCTION
  // Handles Text Search AND Max Price Logic
  const checkFilter = (item) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      // A. Text Matching (Name or Category)
      const matchesText = item.name.toLowerCase().includes(query) || 
                          item.category.toLowerCase().includes(query);

      // B. Price Logic
      // If query is a number (e.g. "150"), show items CHEAPER or EQUAL to it.
      // OR items that literally contain the number (e.g. "1" matches "100")
      const isNumber = !isNaN(query);
      const matchesPrice = isNumber && (item.price <= Number(query) || item.price.toString().includes(query));

      return matchesText || matchesPrice;
  };

  // ⚡ 2. SORT CATEGORIES based on the highest price item inside them
  const getCategoryMaxPrice = (categoryName) => {
    const itemsInCategory = food_list.filter(item => {
        return item.category === categoryName && checkFilter(item);
    });
    if (itemsInCategory.length === 0) return 0;
    return Math.max(...itemsInCategory.map(i => i.price));
  };

  const sortedCategories = [...menu_list].sort((a, b) => {
    return getCategoryMaxPrice(b.menu_name) - getCategoryMaxPrice(a.menu_name);
  });

  return (
    <div className='menu-list'>
      
      {/* Header */}
      <div className={`menu-list-header ${isBulkMode ? 'bulk-mode' : 'single-mode'}`}>
        <p>Image</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        {!isBulkMode && <p>Action</p>}
      </div>
      <hr />
      
      {sortedCategories.map((category, index) => {
        
        // ⚡ 3. APPLY FILTER & SORT ITEMS (High to Low)
        const categoryItems = food_list
            .filter(item => item.category === category.menu_name && checkFilter(item))
            .sort((a, b) => b.price - a.price); // Descending Order

        if (categoryItems.length > 0) {
          return (
            <div key={index}>
              
              {/* Category Title */}
              <h2 className="category-title">{category.menu_name}</h2>

              {/* Items List */}
              {categoryItems.map((item) => {
                return (
                  <div key={item._id} className={`menu-list-row ${isBulkMode ? 'bulk-mode' : 'single-mode'}`}>
                    
                    <img src={url + "/images/" + item.image} alt="" className="menu-product-image" />
                    <p>{item.name}</p>
                    <p>Rs.{item.price}</p>
                    
                    <div className='menu-quantity-control'>
                        {!cartItems[item._id]
                            ? <img className='add-btn' onClick={()=>addToCart(item._id)} src={assets.add_icon_white} alt="" />
                            : <div className='menu-counter'>
                                <img onClick={()=>removeFromCart(item._id)} src={assets.remove_icon_red} alt="" />
                                <p>{cartItems[item._id]}</p>
                                <img onClick={()=>addToCart(item._id)} src={assets.add_icon_green} alt="" />
                              </div>
                        }
                    </div>

                    <p>Rs.{item.price * (cartItems[item._id] || 0)}</p>
                    
                    {!isBulkMode && (
                        <p className='cursor buy-now-small' onClick={() => handleSingleBuy(item._id)}>
                          Buy Now
                        </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      })}

      {/* Footer */}
      {isBulkMode && (
        <div className="menu-list-footer">
            <div className="menu-list-total">
                <h2>Total Cart Value: Rs.{getTotalCartAmount()}</h2>
            </div>
            <button onClick={() => navigate('/order')}>
                PROCEED TO CHECKOUT
            </button>
        </div>
      )}
    </div>
  );
};

export default MenuList;