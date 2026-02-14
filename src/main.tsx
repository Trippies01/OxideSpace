import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ServerProvider, VoiceProvider, UIProvider, UserProvider, MessageProvider } from './contexts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <UIProvider>
                <UserProvider>
                    <ServerProvider>
                        <MessageProvider>
                            <VoiceProvider>
                                <App />
                            </VoiceProvider>
                        </MessageProvider>
                    </ServerProvider>
                </UserProvider>
            </UIProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
