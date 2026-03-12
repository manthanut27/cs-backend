import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SecurityProvider } from './context/SecurityContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SecurityProvider>
        <App />
      </SecurityProvider>
    </BrowserRouter>
  </StrictMode>,
)
