import React, { useContext, useState, useEffect } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const Navbar = ({ setShowLogin }) => {

  const [menu, setMenu] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { getTotalCartAmount, token, setToken, setShowSearch, showSearch, searchQuery, setSearchQuery, userEmail, setUserEmail } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail"); 
    setToken("");
    setUserEmail("");
    navigate("/");
    window.location.reload();// <--- RELOAD PAGE ON LOGOUT
  }

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  }

  const navigateAndScroll = (sectionId, menuName) => {
    setMenu(menuName);
    setIsMenuOpen(false);
    
    if (location.pathname === '/') {
        scrollToSection(sectionId);
    } else {
        navigate('/');
        setTimeout(() => {
            scrollToSection(sectionId);
        }, 100);
    }
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({top: y, behavior: 'smooth'});
    }
  }

  const handleHomeClick = () => {
    setMenu("home");            // Set active menu to Home
    setIsMenuOpen(false);       // Close Mobile Menu
    setShowSearch(false);       // ⚡ CLOSE SEARCH BAR
    setSearchQuery("");         // ⚡ CLEAR SEARCH TEXT
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to Top
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (location.pathname === '/') {
        const exploreMenu = document.getElementById('explore-menu');
        const appDownload = document.getElementById('app-download');
        const footer = document.getElementById('footer');
        
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20) {
             setMenu("contact-us");
             return; 
        }

        const scrollPosition = window.scrollY + 200; 

        if (exploreMenu && appDownload && footer) {
            if (scrollPosition >= footer.offsetTop) {
                setMenu("contact-us");
            } else if (scrollPosition >= appDownload.offsetTop) {
                setMenu("mobile-app");
            } else if (scrollPosition >= exploreMenu.offsetTop) {
                setMenu("menu");
            } else {
                setMenu("home");
            }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <div className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <Link to='/' onClick={handleHomeClick}>
        <img src={assets.logo} alt="" className="logo" />
      </Link>

      {/* 3. Logic: Show Search Bar OR Show Menu */}
      {showSearch ? (
        <div className="navbar-search-bar">
           <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              autoFocus 
           />
           {/* Close Search Button */}
           <button onClick={() => setShowSearch(false)}>✖</button>
        </div>
      ) : (
        <ul className={`navbar-menu ${isMenuOpen ? "show-mobile-menu" : ""}`}>
            {/* 4. HOME CLICK: Triggers Master Reset */}
            <Link 
                to='/' 
                onClick={handleHomeClick} 
                className={menu === "home" ? "active" : ""}
            >
                home
            </Link>
            
            <a href='#explore-menu' onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>menu</a>
            <a href='#app-download' onClick={() => setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>mobile-app</a>
            <a href='#footer' onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>contact us</a>
        </ul>
      )}
      
      <div className="navbar-right">
        {/* Search Icon Click: Opens Search Bar */}
        <img src={assets.search_icon} onClick={() => setShowSearch(true)} alt="" style={{cursor:'pointer'}} />
        
        <div className="navbar-search-icon">
          <Link to='/cart'><img src={assets.basket_icon} alt="" /></Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        
        {!token ? (
          <button onClick={() => setShowLogin(true)}>sign in</button>
        ) : (
          <div className='navbar-profile'>
            <img src={assets.profile_icon} alt="" />
            <ul className="nav-profile-dropdown">
              <li onClick={()=>navigate('/myorders')}><img src={assets.bag_icon} alt="" /><p>Orders</p></li>
              <hr />
              {userEmail === "aftab01561@gmail.com" && (
                 <>
                   <li onClick={()=>window.open("https://food-del-admin-pearl-eight.vercel.app/add", "_blank")}>
                      <img src={assets.profile_icon} alt="" />
                      <p>Admin Panel</p>
                    </li>
                   <hr />
                 </>
              )}
              <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Logout</p></li>
            </ul>
          </div>
        )}

        <div className="navbar-hamburger" onClick={toggleMenu}>
            <div className={`line ${isMenuOpen ? "open" : ""}`}></div>
            <div className={`line ${isMenuOpen ? "open" : ""}`}></div>
            <div className={`line ${isMenuOpen ? "open" : ""}`}></div>
        </div>
      </div>
    </div>
  )
}

export default Navbar