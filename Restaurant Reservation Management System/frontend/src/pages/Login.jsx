import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card">
        <h2 className="text-center mb-3">Login to your account</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@restaurant.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-3" style={{ fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Register here</Link>
        </div>

        <div className="mt-3 p-2 bg-primary" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', fontSize: '0.8rem', backgroundColor: '#f1f5f9' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>Demo Accounts:</p>
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
            <li><strong>Admin:</strong> admin@restaurant.com / Admin123!</li>
            <li><strong>Customer:</strong> customer@restaurant.com / Customer123!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
