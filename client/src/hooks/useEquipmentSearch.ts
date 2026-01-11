import {useState, useMemo} from 'react';
import {useDebounce} from 'use-debounce';
import {useTranslation} from 'react-i18next';
import {useQuery} from '@tanstack/react-query';

export interface ItemSearchHit {
    item_type: 'weapon' | 'armor' | 'equipment' | 'pet';
    id: number;
    description?:string;
    key: string;
    name: string;
    tags: string[]
}

async function fetchItemSearch(
    query: string,
    locale: string,
    limit: number
): Promise<ItemSearchHit[]> {
    const params = new URLSearchParams({
        q: query,
        locale,
        limit: limit.toString(),
    });

    const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/equipment/search?${params}`
    );

    if (!response.ok) {
        throw new Error('Search failed');
    }

    return response.json();
}


export function useItemSearch(options: { debounceMs?: number; limit?: number } = {}) {
    const {debounceMs = 300, limit = 20} = options;
    const {i18n} = useTranslation();

    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query.trim(), debounceMs);

    const enabled = debouncedQuery.length > 0;

    const queryKey = useMemo(
        () => ['item-search', debouncedQuery, i18n.language, limit],
        [debouncedQuery, i18n.language, limit]
    );

    const {data, isLoading, error} = useQuery({
        queryKey,
        queryFn: () =>
            fetchItemSearch(
                debouncedQuery,
                i18n.language,
                limit
            ),
        enabled,
    });

    const clearResults = () => {
        setQuery('');
    };

    return {
        results: data ?? [],
        isLoading,
        error: error instanceof Error ? error.message : null,
        search: setQuery,
        clearResults,
    };
}

async function fetchFullItem(itemType: string, id: number) {
    const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/c/${itemType}/${id}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch item');
    }

    return response.json();
}

export function useItem(itemType?: string, id?: number) {
    return useQuery({
        queryKey: ['item', itemType, id],
        queryFn: () => fetchFullItem(itemType!, id!),
        enabled: Boolean(itemType && id),
    });
}
