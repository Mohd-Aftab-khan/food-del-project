import React, { useState } from 'react'
import './Login.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = ({ setToken, url }) => { // ⚠️ Accepting 'url' as prop
  
  const [data, setData] = useState({
    email: "",
    password: ""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const onLogin = async (event) => {
    event.preventDefault();
    try {
        const response = await axios.post(url + "/api/user/login", data);
        
        if (response.data.success) {
            // ⚡ Security: Only allow your email
            if(data.email === "aftab01561@gmail.com") {
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token);
                toast.success("Welcome Admin!");
            } else {
                toast.error("Access Denied. You are not the Admin.");
            }
        } else {
            toast.error(response.data.message);
        }
    } catch (error) {
        console.error(error);
        toast.error("Login Error");
    }
  }

  return (
    <div className='login-page'>
      <form onSubmit={onLogin} className="login-container">
        <div className="login-title">
            <h2>Admin Panel</h2>
        </div>
        <div className="login-inputs">
            <input onChange={onChangeHandler} name='email' value={data.email} type="email" placeholder='Your Email' required />
            <input onChange={onChangeHandler} name='password' value={data.password} type="password" placeholder='Password' required />
        </div>
        <button type='submit'>Login</button>
      </form>
    </div>
  )
}

export default Login