import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { UserProvider } from './context/UserContext'
import App from './App'
import store from './store'
import 'core-js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <UserProvider>
        <App />
      </UserProvider>
    </Provider>
  </React.StrictMode>
)
