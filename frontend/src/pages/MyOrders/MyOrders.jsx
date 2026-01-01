import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios'
import { assets } from '../../assets/assets'

const MyOrders = () => {

  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [trackOrder, setTrackOrder] = useState(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
        const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
        if (response.data.data) {
            // Sort: Delivered at bottom, Active at top
            const sortedOrders = response.data.data.sort((a, b) => {
                const isADelivered = a.status.toLowerCase().includes("delivered");
                const isBDelivered = b.status.toLowerCase().includes("delivered");
                if (isADelivered && !isBDelivered) return 1;
                if (!isADelivered && isBDelivered) return -1;
                return new Date(b.date) - new Date(a.date);
            });
            setData(sortedOrders);
        }
    } catch (error) { console.error(error); }
  }

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  // --- ⚡ BULLETPROOF STATUS LOGIC ⚡ ---
  const getOrderStepLevel = (status) => {
      const s = status.toLowerCase(); // Convert to lowercase for safety

      if (s.includes("delivered")) return 3;
      if (s.includes("out for delivery")) return 2;
      if (s.includes("food processing")) return 1;
      if (s.includes("order confirmed") || s.includes("order placed")) return 0; 
      
      return 0; // Default
  };

  const getStatusClass = (orderStatus, stepLevel) => {
      const currentLevel = getOrderStepLevel(orderStatus);
      if (currentLevel > stepLevel) return "completed";
      if (currentLevel === stepLevel) return "active"; 
      return ""; 
  };

  const formatDate = (dateString) => {
      const options = { month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => {
            const isDelivered = order.status.toLowerCase().includes("delivered");

            return (
              <div key={index} className='my-orders-order'>
                <div className="order-status-header">
                    <div className={`status-icon ${isDelivered ? "delivered" : "active"}`}>
                        {isDelivered ? "✔" : "●"}
                    </div>
                    <div className={`order-status-text ${isDelivered ? "delivered" : "active"}`}>
                        {isDelivered ? `Delivered, ${formatDate(order.date)}` : order.status}
                    </div>
                </div>

                <div className="order-items-row">
                    <img src={assets.parcel_icon} alt="Package" />
                    <div>
                        <p>{order.items.map((item, idx) => idx === order.items.length - 1 ? item.name + " x " + item.quantity : item.name + " x " + item.quantity + ", ")}</p>
                        <p style={{fontSize:'12px', color:'#555'}}>Amount: <b>Rs. {order.amount}</b></p>
                    </div>
                </div>

                <button 
                    className={isDelivered ? "see-updates-btn" : "track-order-btn"} 
                    onClick={() => setTrackOrder(order)}
                    style={!isDelivered ? {marginTop: '10px', padding:'10px', background:'#ffecdd', border:'none', color:'tomato', cursor:'pointer'} : {}}
                >
                    {isDelivered ? "See all updates" : "Track Order"}
                </button>
              </div>
            )
        })}
      </div>

      {trackOrder && (
          <div className="track-order-popup">
              <div className="tracking-content">
                  <div className="tracking-header">
                      <h3>Order Details</h3>
                      <p>Order ID: {trackOrder._id}</p>
                      {/* Display the status in tomato color to match theme */}
                      <p>Current Status: <b style={{color: 'tomato'}}>{trackOrder.status}</b></p>
                  </div>

                  <div className="timeline">
                      
                      {/* STEP 1: Order Confirmed (Level 0) */}
                      <div className={`timeline-step ${getStatusClass(trackOrder.status, 0) || "completed"}`}>
                          <div className="dot"></div>
                          <div className="step-content">
                              <h4>Order Confirmed</h4>
                              <p className="date-text">{formatDate(trackOrder.date)}</p>
                              <p>Your order has been placed.</p>
                          </div>
                      </div>

                      {/* STEP 2: Food Processing (Level 1) */}
                      <div className={`timeline-step ${getStatusClass(trackOrder.status, 1)}`}>
                          <div className="dot"></div>
                          <div className="step-content">
                              <h4>Food Processing</h4>
                              <p>Your food is being prepared.</p>
                          </div>
                      </div>

                      {/* STEP 3: Out for delivery (Level 2) */}
                      <div className={`timeline-step ${getStatusClass(trackOrder.status, 2)}`}>
                          <div className="dot"></div>
                          <div className="step-content">
                              <h4>Out for delivery</h4>
                              <p>Our rider is on the way.</p>
                          </div>
                      </div>

                      {/* STEP 4: Delivered (Level 3) */}
                      <div className={`timeline-step ${getStatusClass(trackOrder.status, 3)}`}>
                          <div className="dot"></div>
                          <div className="step-content">
                              <h4>Delivered</h4>
                              <p>Order has been delivered.</p>
                          </div>
                      </div>

                  </div>

                  <button className="close-track-btn" onClick={() => setTrackOrder(null)}>Close</button>
              </div>
          </div>
      )}
    </div>
  )
}

export default MyOrders