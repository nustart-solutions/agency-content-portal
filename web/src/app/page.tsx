'use client';

import { login } from '@/app/login/actions';
export default function Home() {
  return (
    <main className="dashboard-login-wrapper">
      <div className="login-container glass-panel">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '1.5rem' }}>
            <img src="https://nustart.solutions/wp-content/uploads/2026/03/VA-darktheme.png" alt="ValueArc Agency Portal" className="sidebar-logo-img sidebar-logo-dark" style={{ maxWidth: '240px' }} />
            <img src="https://nustart.solutions/wp-content/uploads/2026/03/VA-light-theme.png" alt="ValueArc Agency Portal" className="sidebar-logo-img sidebar-logo-light" style={{ maxWidth: '240px' }} />
          </div>
          <p>Sign in to track your brand campaigns.</p>
        </div>
        
        <form className="login-form" action={login}>
          <div className="input-group">
            <label htmlFor="email">Email address</label>
            <input type="email" id="email" name="email" placeholder="client@brand.com" required />
          </div>
          <div className="input-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
              <a href="/forgot-password" className="forgot-link">Forgot password?</a>
            </div>
            <input type="password" id="password" name="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4">
            Sign In to Dashboard
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #0d243a 0%, var(--background) 100%);
          position: relative;
          overflow: hidden;
        }

        .dashboard-login-wrapper::before {
          content: '';
          position: absolute;
          width: 50vw;
          height: 50vw;
          min-width: 500px;
          min-height: 500px;
          background: var(--primary);
          filter: blur(150px);
          opacity: 0.12;
          border-radius: 50%;
          top: -20%;
          right: -10%;
          animation: float 10s infinite ease-in-out alternate;
          z-index: 1;
        }

        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-3vw, 3vw); }
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 3.5rem 2.5rem;
          position: relative;
          z-index: 10;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-header p {
          color: var(--muted);
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .password-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-link {
          font-size: 0.8rem;
          color: var(--primary);
          transition: color 0.2s;
        }
        
        .forgot-link:hover {
          color: var(--primary-hover);
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground);
        }

        .input-group input {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 0.5rem;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--foreground);
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(139,92,246,0.25);
        }

        .w-full {
          width: 100%;
        }

        .mt-4 {
          margin-top: 1rem;
        }
      `}} />
    </main>
  );
}
