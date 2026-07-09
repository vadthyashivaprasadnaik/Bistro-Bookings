import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        Bistro Bookings
      </Link>
      
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-user">
              Hi, <strong>{user.name}</strong> 
              <span className="user-tag">{user.role}</span>
            </span>
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary btn-inline"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
