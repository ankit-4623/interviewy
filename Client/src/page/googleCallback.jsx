// pages/GoogleCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import jwtDecode from 'jwt-decode';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    
    if (token) {
      localStorage.setItem("authToken", token);
      const user = jwtDecode(token);
      console.log("Logged in user:", user);
      navigate("/dashboard"); // or any other route
    } else {
      navigate("/login?error=token_missing");
    }
  }, [navigate]);

  return <div>Processing login...</div>;
};

export default GoogleCallback;
