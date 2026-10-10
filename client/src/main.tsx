import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {GoogleOAuthProvider} from '@react-oauth/google'
import './index.css'
import './api/apiClient'
import App from './App.tsx'
import {Provider, rootStore} from './store'
import ModalProvider from './core/context/ModalProvider'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <Provider value={rootStore}>
                <ModalProvider>
                    <App/>
                </ModalProvider>
            </Provider>
        </GoogleOAuthProvider>
    </StrictMode>,
)
