import React, { useState, useEffect } from 'react'
import './Orders.css' // Ensure this matches your file structure
import axios from 'axios'
import { assets } from '../../assets/assets'

const OrderHistory = ({ url }) => {

  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchAllOrders = async () => {
    try {
        const response = await axios.get(url + "/api/order/list");
        if (response.data.success) {
          // Sort Newest First
          const sortedOrders = response.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
          setOrders(sortedOrders);
          console.log("Orders fetched:", sortedOrders); // Check Console if still empty
        }
    } catch (error) {
        console.error("Error fetching history:", error);
    }
  }

  const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  }

  useEffect(() => {
    fetchAllOrders();
  }, [url]);

  return (
    <div className='order add'>
      <h3>Order History (Delivered)</h3>
      <div className="order-list">
        
        {/* ⚡ ROBUST FILTER: Checks if status includes "Delivered" */}
        {orders.filter(order => order.status && order.status.includes("Delivered")).map((order, index) => (
          
          <div key={index} className='order-container' style={{borderLeft: '5px solid #26a541'}}>
            <div className='order-item'>
              <img src={assets.parcel_icon} alt="" />
              <div>
                <p className='order-item-food'>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) return item.name + " x " + item.quantity
                    else return item.name + " x " + item.quantity + ", "
                  })}
                </p>
                <p className='order-item-name'>{order.address.firstName + " " + order.address.lastName}</p>
                <p className='order-item-phone'>{order.address.phone}</p>
              </div>
              <p>Items: {order.items.length}</p>
              <p>Rs. {order.amount}</p>
              
              <div className='order-actions'>
                <p style={{color: '#26a541', fontWeight: 'bold', fontSize: '15px'}}>✅ Delivered</p>
                <button onClick={() => toggleOrder(order._id)} className='view-btn'>
                   {expandedOrderId === order._id ? "Close" : "View Items"}
                </button>
              </div>
            </div>

            {expandedOrderId === order._id && (
              <div className="order-expanded-details">
                <div className="detailed-items-grid">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="detailed-item-card">
                      <img src={url + "/images/" + item.image} alt={item.name} />
                      <div className="item-info">
                        <p className="item-name">{item.name}</p>
                        <p>Qty: <b>{item.quantity}</b></p>
                        <p>Price: <b>Rs. {item.price}</b></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {orders.filter(order => order.status && order.status.includes("Delivered")).length === 0 && <p>No history found.</p>}
      </div>
    </div>
  )
}

export default OrderHistory