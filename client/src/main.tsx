import {CharacterProvider} from "@/CharacterContext/CharacterContext.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 min
            retry: 1,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <CharacterProvider>
                <App/>
            </CharacterProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
