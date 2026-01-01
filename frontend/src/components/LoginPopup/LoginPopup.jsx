import React, { useContext, useState, useEffect } from 'react'
import './LoginPopup.css' // 👈 LINKS TO THE SEPARATE CSS FILE
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import axios from "axios"
import { toast } from 'react-toastify'; 

const LoginPopup = ({setShowLogin}) => {

    // ⚡ Get setUserEmail from Context to save the user ID
    const {url, setToken, setUserEmail} = useContext(StoreContext)
    
    const [currState, setCurrState] = useState("Login") 
    const [data, setData] = useState({ name:"", email:"", password:"", newPassword:"" })
    
    // OTP & Timer States
    const [emailOtp, setEmailOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [timer, setTimer] = useState(30); 
    const [canResend, setCanResend] = useState(false);

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({...data, [name]: value}))
    }

    // Timer Logic
    useEffect(() => {
        let interval;
        if (isOtpSent && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true); 
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isOtpSent, timer]);

    // Send OTP (Sign Up)
    const sendSignUpOtp = async () => {
        setIsOtpSent(true); setTimer(30); setCanResend(false); 
        const response = await axios.post(url + "/api/user/send-otp", { email: data.email });
        if (response.data.success) {
            toast.success(`OTP sent to ${data.email}`);
        } else { 
            setIsOtpSent(false); 
            toast.error(response.data.message); 
        }
    }

    // Send OTP (Reset Password)
    const sendResetOtp = async () => {
        setIsOtpSent(true); setTimer(30); setCanResend(false); 
        const response = await axios.post(url + "/api/user/send-reset-otp", { email: data.email });
        if (response.data.success) {
            toast.success("Reset OTP sent to email");
        } else { 
            setIsOtpSent(false); 
            toast.error(response.data.message); 
        }
    }

    const onSubmit = async (event) => {
        event.preventDefault();
        
        if (currState === "Login") {
            const response = await axios.post(url + "/api/user/login", data);
            if (response.data.success) {
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token);
                
                // ⚡ SAVE EMAIL (Crucial for Admin Panel)
                localStorage.setItem("userEmail", data.email); 
                setUserEmail(data.email);
                
                setShowLogin(false);
                toast.success("Login Successful!");
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else { 
                toast.error(response.data.message); 
            }

        } else if (currState === "Sign-Up") {
            if (!isOtpSent) {
                sendSignUpOtp();
            } else {
                const response = await axios.post(url + "/api/user/register", { ...data, otp: emailOtp });
                if (response.data.success) {
                    setToken(response.data.token);
                    localStorage.setItem("token", response.data.token);
                    
                    // ⚡ SAVE EMAIL
                    localStorage.setItem("userEmail", data.email);
                    setUserEmail(data.email);

                    setShowLogin(false);
                    toast.success("Account Created Successfully!");
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else { 
                    toast.error(response.data.message); 
                }
            }

        } else if (currState === "Reset") {
            if (!isOtpSent) {
                sendResetOtp();
            } else {
                const response = await axios.post(url + "/api/user/reset-password", { email: data.email, otp: emailOtp, newPassword: data.newPassword });
                if (response.data.success) {
                    toast.success("Password Changed! Please Login.");
                    setCurrState("Login");
                    setIsOtpSent(false);
                } else { 
                    toast.error(response.data.message); 
                }
            }
        }
    }

    return (
        <div className='login-popup'>
            <div className='login-popup-container'>
                <div className='login-popup-title'>
                    <h2>{currState === "Reset" ? "Reset Password" : currState}</h2>
                    <img onClick={()=>setShowLogin(false)} src={assets.cross_icon} alt='' />
                </div>

                <form onSubmit={onSubmit} className="login-popup-inputs">
                    {currState==="Sign-Up" && (
                        <input name='name' onChange={onChangeHandler} value={data.name} type='text' placeholder='Your Name' required disabled={isOtpSent} />
                    )}
                    <input name='email' onChange={onChangeHandler} value={data.email} type='email' placeholder='Your Email' required disabled={isOtpSent} />
                    {currState!=="Reset" && (
                        <input name='password' onChange={onChangeHandler} value={data.password} type='password' placeholder='Password' required disabled={isOtpSent} />
                    )}

                    {isOtpSent && (
                        <div className="otp-verification-box">
                            <p className="otp-sent-msg">✓ Code sent to {data.email}</p>
                            <p className="otp-label">Enter Verification Code</p>
                            <input type="text" placeholder="XXXXXX" value={emailOtp} onChange={(e)=>setEmailOtp(e.target.value)} required maxLength={6} className="otp-input-style" />
                            
                            {currState === "Reset" && (
                                <input type="password" name="newPassword" placeholder="Enter New Password" value={data.newPassword} onChange={onChangeHandler} required className="new-pass-input" />
                            )}

                            <div className="timer-text">
                                {!canResend ? <span>Resend in 00:{timer}</span> : <span onClick={currState==="Reset"?sendResetOtp:sendSignUpOtp} className="resend-btn">Resend OTP</span>}
                            </div>
                        </div>
                    )}

                    <button type='submit'>
                        {currState === "Login" ? "Login" : (isOtpSent ? (currState==="Reset"?"Reset Password":"Verify & Create Account") : (currState==="Reset"?"Send OTP":"Get Verification Code"))}
                    </button>

                    {currState === "Login" && !isOtpSent && (
                        <p className="forgot-pass-link" onClick={()=>{setCurrState("Reset"); setIsOtpSent(false);}}>Forgot Password?</p>
                    )}

                    {!isOtpSent && currState!=="Reset" && (
                         <div className="login-popup-condition">
                            <input type='checkbox' required /> <p>I agree to terms of use.</p>
                        </div>
                    )}
                   
                    {currState!=="Reset" && (
                        currState==="Login"
                        ?<p>Create account? <span onClick={()=>{setCurrState("Sign-Up"); setIsOtpSent(false);}}>Click here</span></p>
                        :<p>Already have account? <span onClick={()=>{setCurrState("Login"); setIsOtpSent(false);}}>Login here</span></p>
                    )}
                     {currState==="Reset" && (
                        <p className="back-to-login" onClick={()=>{setCurrState("Login"); setIsOtpSent(false);}}>Back to Login</p>
                    )}
                </form>
            </div>
        </div>
    )
}

export default LoginPopup