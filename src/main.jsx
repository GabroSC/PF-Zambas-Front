import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'


createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain="dev-00ubiakhkdupzcl1.us.auth0.com"
      clientId="JliITT1f01goscok3hPRSkgvq4ft1HdL"
      authorizationParams={{
        audience: "https://dev-00ubiakhkdupzcl1.us.auth0.com/api/v2/",
        redirect_uri: window.location.origin
      }}
    >
    <App />
  </Auth0Provider>,
)