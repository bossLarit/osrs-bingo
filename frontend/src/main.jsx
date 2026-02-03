import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DialogProvider } from './components/Dialog.jsx'
import { ErrorBoundary } from './components/ui'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DialogProvider>
        <App />
      </DialogProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
