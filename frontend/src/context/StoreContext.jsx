import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState("");
    const [food_list, setFoodList] = useState([]);
    const [userEmail, setUserEmail] = useState("");
    const url = "https://food-del-project.onrender.com";
    const [searchQuery, setSearchQuery] = useState(""); 
    const [showSearch, setShowSearch] = useState(false);

    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        } else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }
        if (token) {
            await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
        }
    };

    

    const addToCartQuantity = async (itemId, quantity) => {
        setCartItems((prev) => {
            const currentCount = prev[itemId] || 0;
            return { ...prev, [itemId]: currentCount + quantity };
        });
        if (token) {
            for (let i = 0; i < quantity; i++) {
                await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
            }
        }
    };

    // --- MAIN FUNCTION USED BY CHATBOT ---
    const setCartItemQuantity = async (itemId, quantity) => {
        const currentCount = cartItems[itemId] || 0;
        const difference = quantity - currentCount; 

        setCartItems((prev) => ({ ...prev, [itemId]: quantity }));

        if (token && difference !== 0) {
            if (difference > 0) {
                // Add the difference
                for (let i = 0; i < difference; i++) {
                    await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
                }
            } else {
                // Remove the difference
                for (let i = 0; i < Math.abs(difference); i++) {
                    await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
                }
            }
        }
    };

    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
        if (token) {
            await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
        }
    };

    const clearCart = async () => {
        setCartItems({}); 
        if (token) {
            await axios.post(url + "/api/cart/clear", {}, { headers: { token } });
        }
    };

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        if (!cartItems) return 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                if (itemInfo) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }
        return totalAmount;
    };

    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url + "/api/food/list");
            if(response.data.data){
                setFoodList(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching food list:", error);
        }
    };

    const loadCartData = async (token) => {
        try {
            const response = await axios.post(url+"/api/cart/get",{},{headers:{token}});
            if (response.data.success) {
                setCartItems(response.data.cartData);
            } else {
                localStorage.removeItem("token");
                setToken("");
            }
        } catch (error) {
            console.error("Error loading cart:", error);
        }
    };

    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"));
                // ⚡ 2. LOAD EMAIL FROM LOCAL STORAGE (If user refreshes page)
                const storedEmail = localStorage.getItem("userEmail");
                if (storedEmail) {
                    setUserEmail(storedEmail);
                }
                await loadCartData(localStorage.getItem("token"));
            }
        }
        loadData();
    }, []);

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        addToCartQuantity,
        setCartItemQuantity, // Exported
        removeFromCart,
        clearCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        searchQuery,      // Export these
        setSearchQuery,   // Export these
        showSearch,       // Export these
        setShowSearch,
        userEmail,      
        setUserEmail 
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;