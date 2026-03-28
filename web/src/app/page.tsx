'use client';

export default function Home() {
  return (
    <main className="dashboard-login-wrapper">
      <div className="login-container glass-panel">
        <div className="login-header">
          <div className="logo-pulse"></div>
          <h1>Agency Portal</h1>
          <p>Sign in to track your brand campaigns.</p>
        </div>
        
        <form className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email address</label>
            <input type="email" id="email" placeholder="client@brand.com" />
          </div>
          <div className="input-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>
            <input type="password" id="password" placeholder="••••••••" />
          </div>
          <button type="button" className="btn btn-primary w-full mt-4">
            Sign In to Dashboard
          </button>
        </form>
      </div>

      <style jsx>{`
        .dashboard-login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1f1a30 0%, var(--background) 100%);
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

        .logo-pulse {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          border-radius: 14px;
          margin: 0 auto 1.5rem auto;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
          animation: pulse 2.5s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(139,92,246, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(139,92,246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139,92,246, 0); }
        }

        .login-header h1 {
          font-size: 1.85rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
          color: white;
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
          color: #a78bfa;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #e4e4e7;
        }

        .input-group input {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 0.5rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          color: white;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(139,92,246,0.25);
          background: rgba(0,0,0,0.4);
        }

        .w-full {
          width: 100%;
        }

        .mt-4 {
          margin-top: 1rem;
        }
      `}</style>
    </main>
  );
}
