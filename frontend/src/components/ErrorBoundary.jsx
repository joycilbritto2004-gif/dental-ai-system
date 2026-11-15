import React from 'react';
import { AlertCircle, RefreshCw, Home, LogOut } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DentaAI Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem('dentaai_token');
      localStorage.removeItem('dentaai_user');
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A192F 0%, #17324D 100%)',
          padding: '24px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #BFD4E5',
            boxShadow: '0 20px 48px rgba(7, 26, 51, 0.25)',
            maxWidth: '560px',
            width: '100%',
            padding: '36px 32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <AlertCircle size={32} />
            </div>

            <h2 style={{ margin: '0 0 10px', fontSize: '1.45rem', fontWeight: 800, color: '#17324D' }}>
              Portal Render Issue Detected
            </h2>

            <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.5 }}>
              The portal encountered an unexpected display error while loading this view. You can reload the page or re-authenticate into your session.
            </p>

            {this.state.error && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: '#991B1B',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#00A6A6',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)'
                }}
              >
                <RefreshCw size={15} /> Reload Page
              </button>

              <button
                onClick={this.handleResetSession}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  color: '#17324D',
                  border: '1px solid #BFD4E5',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <LogOut size={15} /> Sign In Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
