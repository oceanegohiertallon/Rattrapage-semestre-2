import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getLoaderFromUrl } from './api/demoScenarios'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App loader={getLoaderFromUrl()} />
  </StrictMode>,
)
