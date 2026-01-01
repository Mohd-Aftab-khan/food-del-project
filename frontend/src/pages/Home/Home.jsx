import React, { useState, useContext } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import AppDownload from '../../components/AppDownload/AppDownload';
import HowItWorks from '../../components/HowItWorks/HowItWorks'; 
import { StoreContext } from '../../context/StoreContext';

const Home = () => {

  const [category,setCategory] = useState("All");

  // 3. Get search state
  const { showSearch, searchQuery } = useContext(StoreContext);

  // Check if we are in "Search Mode"
  // If the search bar is open OR user has typed something
  const isSearching = showSearch || searchQuery.length > 0;

  return (
    <div>
      {/* 4. CONDITIONAL RENDERING: Only show these if NOT searching */}
      {!isSearching && <Header />}
      {!isSearching && <ExploreMenu category={category} setCategory={setCategory} />}
      
      {/* FoodDisplay is ALWAYS visible, but now it will be at the top when searching */}
      <FoodDisplay category={category} />
      
      {!isSearching && <AppDownload />}
    </div>
  )
}

export default Home