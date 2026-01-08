import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import store from './store'
import 'core-js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
)
