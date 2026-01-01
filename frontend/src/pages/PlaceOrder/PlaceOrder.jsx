import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { PayPalButtons } from "@paypal/react-paypal-js";

const PlaceOrder = () => {
  const { getTotalCartAmount, token, setToken, food_list, cartItems, url, setCartItems } = useContext(StoreContext)
  const navigate = useNavigate();
  const location = useLocation();

  const isDirectOrder = location.state?.fromChatbot;
  const directItems = location.state?.items || [];

  // Initialize as EMPTY ARRAY
  const [allAddresses, setAllAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editIndex, setEditIndex] = useState(-1); 
  const [showPopup, setShowPopup] = useState(false);

  const [data, setData] = useState({
    firstName: "", lastName: "", email: "", street: "",
    city: "", state: "", zipcode: "", country: "", phone: ""
  })

  // --- CALCULATION ---
  const getOrderTotal = () => {
      let total = 0;
      if (isDirectOrder) {
          total = directItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      } else {
          total = getTotalCartAmount();
      }
      return total;
  }

  // --- FETCH ADDRESSES ---
  async function fetchAddresses() {
    if (token) {
      try {
        const response = await axios.get(url + "/api/user/get-address", { headers: { token } });
        if (response.data.success) {
          setAllAddresses(response.data.address || []);
          if (!response.data.address || response.data.address.length === 0) {
              setShowAddForm(true);
          }
        } else if (response.data.message === "Invalid Token" || response.data.message === "User not found") {
            // Auto Logout on Error
            localStorage.removeItem("token");
            setToken("");
            navigate("/");
        }
      } catch (error) { 
          console.error("Error fetching addresses"); 
      }
    }
  }
  useEffect(() => { fetchAddresses(); }, [token, url]);

  // --- FORM HANDLERS ---
  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const handleEditClick = (index, address) => {
      setEditIndex(index);
      setData(address);
      setShowAddForm(true);
  }

  const handleDeleteAddress = async (id) => {
      if(!window.confirm("Delete this address?")) return;
      try {
          const response = await axios.post(url + "/api/user/remove-address", { id: id }, { headers: { token } });
          if(response.data.success) {
              await fetchAddresses();
              if (selectedAddressIndex !== -1 && allAddresses[selectedAddressIndex]?._id === id) {
                  setSelectedAddressIndex(-1);
              }
          }
      } catch (error) { console.log(error); }
  }

  const handleSaveAddress = async () => {
    // ✅ STRICTER VALIDATION: Check all fields
    if (data.phone.length !== 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return; // Stop the function here
    }
    if(!data.firstName || !data.lastName || !data.email || !data.street || !data.city || !data.state || !data.zipcode || !data.country || !data.phone) {
        alert("Please fill all required fields");
        return;
    }
    try {
        let response;
        if (editIndex === -1) {
            response = await axios.post(url + "/api/user/save-address", { address: data }, { headers: { token } });
        } else {
            response = await axios.post(url + "/api/user/update-address", { addressIndex: editIndex, address: data }, { headers: { token } });
        }
        if(response.data.success) {
            await fetchAddresses(); 
            setShowAddForm(false);
            setEditIndex(-1);
            setData({firstName: "", lastName: "", email: "", street: "", city: "", state: "", zipcode: "", country: "", phone: ""});
        } else { 
            alert(response.data.message); 
        }
    } catch (error) { console.log(error); }
  }

  // --- PAYMENT SUCCESS ---
  const handlePaymentSuccess = async (paymentDetails) => {
    let orderItems = [];
    if (isDirectOrder) {
        orderItems = directItems;
    } else {
        food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            let itemInfo = item;
            itemInfo["quantity"] = cartItems[item._id];
            orderItems.push(itemInfo);
          }
        })
    }
    
    let finalAddress = allAddresses && allAddresses[selectedAddressIndex];
    if (!finalAddress) {
        alert("Please select an address!");
        return;
    }

    let orderData = {
      address: finalAddress,
      items: orderItems,
      amount: getOrderTotal() + 40,
      payment: true, 
      paymentId: paymentDetails.id 
    }
    try {
      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });
      if (response.data.success) {
        if (isDirectOrder) {
             setCartItems({}); 
        } else {
            setCartItems({});
            await axios.post(url + "/api/cart/clear", {}, { headers: { token } });
        }
        setShowPopup(true);
      }
    } catch (error) { console.log(error); }
  }

  const closePopup = () => {
    setShowPopup(false);
    navigate("/myorders");
  }

  return (
    <>
    <div className='place-order'>
        <div className="place-order-left">
          <h2 className="section-title">Delivery Information</h2>
          
          {!showAddForm && (
            <div className="address-list">
                {allAddresses && allAddresses.length > 0 ? (
                    allAddresses.map((addr, index) => (
                        <div key={index} 
                             className={`address-card ${selectedAddressIndex === index ? 'selected' : ''}`} 
                             onClick={() => setSelectedAddressIndex(index)}>
                            <div className="address-card-content">
                                <input type="radio" checked={selectedAddressIndex === index} readOnly />
                                <div className="address-details">
                                    <p className="address-name">{addr.firstName} {addr.lastName}</p>
                                    <p className="address-text">{addr.street}, {addr.city}, {addr.state}, {addr.zipcode}</p>
                                    <p className="address-phone">📞 {addr.phone}</p>
                                </div>
                            </div>
                            <div className="address-actions">
                                <button className="edit-btn" onClick={(e) => {e.stopPropagation(); handleEditClick(index, addr)}}>Edit</button>
                                <button className="delete-btn" onClick={(e) => {e.stopPropagation(); handleDeleteAddress(addr._id)}}>Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No addresses found.</p>
                )}

                <div className="add-address-card" onClick={() => {
                      if (allAddresses && allAddresses.length >= 5) {
                          alert("Max 5 addresses allowed.");
                      } else {
                          setShowAddForm(true); 
                          setEditIndex(-1); 
                          setData({firstName: "", lastName: "", email: "", street: "", city: "", state: "", zipcode: "", country: "", phone: ""});
                      }
                  }}>
                    <span className="plus-icon">+</span>
                    <p>Add New Address</p>
                </div>
            </div>
          )}

          {showAddForm && (
            <div className="address-form-container">
                 <div className="form-header">
                    <h3>{editIndex === -1 ? "Add New Address" : "Edit Address"}</h3>
                    <button className="close-form-btn" onClick={()=>setShowAddForm(false)}>Cancel</button>
                 </div>
                 
                 <div className="multi-fields">
                    <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' />
                    <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name' />
                 </div>
                 <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address' />
                 <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street' />
                 <div className="multi-fields">
                    <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City' />
                    <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State' />
                 </div>
                 <div className="multi-fields">
                    <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code' />
                    <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country' />
                 </div>
                 <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone' />
                 
                 <button className="save-address-btn" onClick={handleSaveAddress}>
                    {editIndex === -1 ? "SAVE ADDRESS" : "UPDATE ADDRESS"}
                 </button>
            </div>
          )}
        </div>

        <div className="place-order-right">
          <div className="cart-total">
            <h2>Order Summary</h2>
            <div className="cart-total-details">
                <p>Items Price</p>
                <p>Rs. {getOrderTotal()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
                <p>Delivery Fee</p>
                <p>Rs. 40</p>
            </div>
            <hr />
            <div className="cart-total-details total">
                <b>Total Amount</b>
                <b>Rs. {getOrderTotal() === 0 ? 0 : getOrderTotal() + 40}</b>
            </div>
            <div className="payment-section">
                {selectedAddressIndex === -1 ? (
                    <div className="select-address-warning">Please select an address to proceed</div>
                ) : (
                    <PayPalButtons 
                        style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                        createOrder={(data, actions) => {
                            return actions.order.create({
                                purchase_units: [{
                                    amount: { value: (getOrderTotal() + 40).toString() }
                                }]
                            });
                        }}
                        onApprove={(data, actions) => {
                            return actions.order.capture().then((details) => {
                                handlePaymentSuccess(details);
                            });
                        }}
                        onError={(err) => {
                            console.error(err);
                            alert("Payment Failed");
                        }}
                    />
                )}
            </div>
          </div>
        </div>
    </div>

    {showPopup && (
        <div className="order-popup">
          <div className="order-popup-content">
            <div className="popup-icon">✔️</div>
            <h2>Order Successful!</h2>
            <p>Your order has been placed successfully.</p>
            <button onClick={closePopup}>View Orders</button>
          </div>
        </div>
      )}
    </>
  )
}

export default PlaceOrder