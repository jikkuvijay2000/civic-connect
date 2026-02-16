import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Import our custom CSS
// Import our custom CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'leaflet/dist/leaflet.css'

// Import all of Bootstrap’s JS
import * as bootstrap from 'bootstrap'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
