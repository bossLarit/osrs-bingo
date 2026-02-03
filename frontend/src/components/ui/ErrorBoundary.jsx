import { Component, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Detailed console logging
    console.group('🚨 ErrorBoundary - Fejl fanget');
    console.error('Fejl:', error);
    console.error('Fejl besked:', error?.message);
    console.error('Fejl type:', error?.name);
    console.error('Stack trace:', error?.stack);
    console.error('Component stack:', errorInfo?.componentStack);
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  copyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Fejl: ${error?.message}
Type: ${error?.name}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim();
    navigator.clipboard.writeText(errorText);
    alert('Fejl kopieret til udklipsholder!');
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-red-50 border-2 border-red-200 rounded-lg">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Noget gik galt
          </h2>
          <p className="text-red-600 text-center mb-2 max-w-md">
            {this.props.fallbackMessage || 'Der opstod en uventet fejl. Prøv at genindlæse siden.'}
          </p>
          
          {/* Error type hint */}
          <p className="text-red-500 text-sm mb-4 font-mono">
            {error?.name}: {error?.message?.substring(0, 100)}
          </p>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw size={16} />
              Prøv igen
            </button>
            <button
              onClick={this.toggleDetails}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? 'Skjul detaljer' : 'Vis detaljer'}
            </button>
            <button
              onClick={this.copyError}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy size={16} />
              Kopier
            </button>
          </div>
          
          {/* Detailed error info */}
          {showDetails && (
            <div className="w-full max-w-2xl bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64">
              <div className="mb-2">
                <span className="text-yellow-400">Fejl type:</span> {error?.name}
              </div>
              <div className="mb-2">
                <span className="text-yellow-400">Besked:</span> {error?.message}
              </div>
              <div className="mb-2">
                <span className="text-yellow-400">Stack trace:</span>
                <pre className="whitespace-pre-wrap text-red-400 mt-1">{error?.stack}</pre>
              </div>
              {errorInfo?.componentStack && (
                <div>
                  <span className="text-yellow-400">Component stack:</span>
                  <pre className="whitespace-pre-wrap text-blue-400 mt-1">{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackMessage: PropTypes.string,
};

export default ErrorBoundary;
