import React, { useState, useEffect } from 'react'
import './Orders.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const Orders = ({ url }) => {

  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchAllOrders = async () => {
    const response = await axios.get(url + "/api/order/list");
    if (response.data.success) {
      // ⚡ SORTING: Newest Orders First
      const sortedOrders = response.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(sortedOrders);
    } else {
      toast.error("Error fetching orders");
    }
  }

  const statusHandler = async (event, orderId) => {
    const newStatus = event.target.value;
    const response = await axios.post(url + "/api/order/status", {
      orderId,
      status: newStatus
    });

    if (response.data.success) {
      if (newStatus === "Delivered") {
          toast.success("Order Moved to History! 🟢"); 
      } else {
          toast.success("Status Updated");
      }
      await fetchAllOrders(); // Refresh the list immediately
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
      <h3>Order Dispatch (Active)</h3>
      <div className="order-list">
        
        {/* ⚡ FILTER: Only show orders that are NOT "Delivered" */}
        {orders.filter(order => order.status !== "Delivered").map((order, index) => (
          
          <div key={index} className='order-container'>
            <div className='order-item'>
              <img src={assets.parcel_icon} alt="" onClick={() => toggleOrder(order._id)} className='cursor-pointer'/>
              <div>
                <p className='order-item-food'>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return item.name + " x " + item.quantity
                    } else {
                      return item.name + " x " + item.quantity + ", "
                    }
                  })}
                </p>
                <p className='order-item-name'>{order.address.firstName + " " + order.address.lastName}</p>
                <div className='order-item-address'>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p className='order-item-phone'>{order.address.phone}</p>
              </div>
              <p>Items: {order.items.length}</p>
              <p>Rs. {order.amount}/-</p>
              
              <div className='order-actions'>
                <select onChange={(event) => statusHandler(event, order._id)} value={order.status} className='status-select'>
                  <option value="Order Confirmed">Order Confirmed</option>
                  <option value="Food Processing">Food Processing</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
                
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
        {orders.filter(order => order.status !== "Delivered").length === 0 && <p>No active orders.</p>}
      </div>
    </div>
  )
}

export default Orders