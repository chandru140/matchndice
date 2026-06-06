import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ShopContextProvider from './context/ShopContext.jsx'
import ChatbotProvider from './context/ChatbotContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
import './chatbot.css'
import './styles/whatsappButton.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ShopContextProvider>
      <ChatbotProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ChatbotProvider>
    </ShopContextProvider>
  </BrowserRouter>
)
