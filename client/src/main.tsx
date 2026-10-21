import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import './api/apiClient'
import Root from './Root.tsx'
import {i18nReady} from './i18n'

// i18n loi van render app (fallback chuoi vi/key)
i18nReady.catch(console.error).finally(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <Root/>
        </StrictMode>,
    )
})
