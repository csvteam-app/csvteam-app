import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({
            hasError: true,
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: 'black', color: '#ff6b6b', zIndex: 9999, position: 'relative', fontFamily: 'monospace', fontSize: '0.85rem', maxHeight: '100vh', overflow: 'auto' }}>
                    <h2 style={{ color: '#ff6b6b', marginBottom: '16px' }}>Something went wrong.</h2>
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)' }}>
                        <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: '0.75rem' }}>
                        <strong>Component Stack:</strong>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </div>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); window.location.reload(); }}
                        style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--accent-gold, #d4af37)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Ricarica App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
