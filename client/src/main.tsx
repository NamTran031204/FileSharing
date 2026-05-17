import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import './api/apiClient'
import App from './App.tsx'
import {Provider, rootStore} from './store'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider value={rootStore}>
            <App/>
        </Provider>
    </StrictMode>,
)
