import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes, Navigate } from "react-router-dom"; 
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ⚠️ VERIFY THESE IMPORT PATHS
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import OrderHistory from "./pages/Orders/OrderHistory"; 
import Login from "./pages/Login/Login"; // <--- THIS MUST MATCH FOLDER NAME

const App = () => {
  const url = "https://food-del-project.onrender.com";
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if(storedToken) {
        setToken(storedToken);
    }
  }, [])

  return (
    <div>
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} url={url} />
      ) : (
        <>
          <Navbar />
          <hr />
          <div className="app-content">
            <Sidebar />
            <Routes>
              <Route path="/" element={<Navigate to="/add" />} />
              <Route path="/add" element={<Add url={url} />} />
              <Route path="/list" element={<List url={url} />} />
              <Route path="/orders" element={<Orders url={url} />} />
              <Route path="/history" element={<OrderHistory url={url} />} /> 
            </Routes>
          </div>
        </>
      )}
    </div>
  );
};

export default App;