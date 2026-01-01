import React, { useContext } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({category}) => {

  const { food_list, searchQuery } = useContext(StoreContext) // Get searchQuery

  return (
    <div className='food-display' id='food-display'>
      <h2>{searchQuery ? `Search results for "${searchQuery}"` : "Top dishes near you"}</h2>

      <div className="food-display-list">
        {food_list.filter((item) => {
            // ⚡ THE MAGIC SEARCH LOGIC ⚡
            const lowerSearch = searchQuery.toLowerCase();
            const lowerName = item.name.toLowerCase();
            const lowerDesc = item.description.toLowerCase();
            const lowerCat = item.category.toLowerCase();
            const strPrice = item.price.toString();

            // 1. Check Category First (Must match selected tab)
            if (category !== "All" && category !== item.category) {
                return false;
            }

            // 2. PRICE LOGIC (Fix: item.price instead of item.Price)
            // If user types a number (e.g. "300"), show items CHEAPER or EQUAL
            const isNumber = !isNaN(lowerSearch) && lowerSearch !== "";
            if (isNumber) {
                return item.price <= Number(lowerSearch);
            }

            // 3. TEXT LOGIC (Name, Description, Category)
            // If user types text, check name/desc/category
            return lowerName.includes(lowerSearch) || 
                   lowerDesc.includes(lowerSearch) || 
                   lowerCat.includes(lowerSearch);

            // Also respect the "Category" tab filter if one is selected
            const matchesCategory = category === "All" || category === item.category;

            return matchesSearch && matchesCategory;

        })
        .sort((a, b) => b.price - a.price)
        .map((item, index) => {
            return <FoodItem key={index} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} />
        })}
      </div>
    </div>
  )
}

export default FoodDisplay