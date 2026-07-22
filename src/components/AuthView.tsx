import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Sparkles, Mail, Lock, User, Bot, AlertCircle } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { signIn, signUp } = useWorkspace();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (isSignUpMode && !name) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUpMode) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError('Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Left split pane: Minimalist Branding Info */}
      <div 
        style={{ 
          flex: 1.1, 
          background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
          color: '#f8fafc',
          padding: '64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: '48px', left: '64px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: 'white' }}>B</div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold', letterSpacing: '0.05em', fontSize: '14px' }}>BIG BALLOON</span>
        </div>

        <div style={{ maxWidth: '480px', marginTop: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 700, color: 'white', lineHeight: '1.2', margin: '0 0 16px' }}>
            Structured Document Workspace for Modern Researchers
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', margin: '0 0 32px' }}>
            BIG BALLOON consolidates literature reviews, citation mapping, and force-directed connection mapping with a split-screen AI reader chatbot.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: '#3b82f6', marginTop: '2px' }}><Sparkles size={16} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'white' }}>ELI5 Document Scanning</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Simplify dense technical jargon into understandable student language.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: '#6366f1', marginTop: '2px' }}><Bot size={16} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'white' }}>Side-by-Side PDF Conversation</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Navigate table of contents sections and query paragraphs in real-time.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right split pane: Form gateway */}
      <div 
        style={{ 
          flex: 0.9, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '48px',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px' }}>
              {isSignUpMode ? 'Create research space' : 'Welcome back'}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isSignUpMode ? 'Get started with BIG BALLOON today.' : 'Sign in to access your saved reviews.'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isSignUpMode && (
              <div className="form-group">
                <label>Your Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ width: '100%', paddingLeft: '32px' }}
                    placeholder="Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px' }}
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px' }}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px', width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Authenticating...' : isSignUpMode ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', color: 'var(--text-secondary)' }}>
            {isSignUpMode ? (
              <span>
                Already have an account?{' '}
                <button className="btn" style={{ padding: 0, color: 'var(--accent-primary)', fontWeight: 600 }} onClick={() => setIsSignUpMode(false)}>
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to BIG BALLOON?{' '}
                <button className="btn" style={{ padding: 0, color: 'var(--accent-primary)', fontWeight: 600 }} onClick={() => setIsSignUpMode(true)}>
                  Create account
                </button>
              </span>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
export default AuthView;
