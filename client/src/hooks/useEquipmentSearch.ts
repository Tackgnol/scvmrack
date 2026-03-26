import {useState, useMemo} from 'react';
import {useDebounce} from 'use-debounce';
import {useTranslation} from 'react-i18next';
import {useQuery} from '@tanstack/react-query';

export interface ItemSearchHit {
    itemType: 'weapon' | 'armor' | 'equipment' | 'pet';
    id: number;
    description?:string;
    key: string;
    name: string;
    tags: string[]
}

type RawItemSearchHit = ItemSearchHit & {
    item_type?: ItemSearchHit['itemType'];
};

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

    const data = await response.json() as RawItemSearchHit[];
    return data.map((item) => ({
        ...item,
        itemType: item.itemType ?? item.item_type ?? 'equipment',
        tags: item.tags ?? [],
    }));
}


export function useItemSearch(options: { debounceMs?: number; limit?: number } = {}) {
    const {debounceMs = 300, limit = 20} = options;
    const {i18n} = useTranslation();

    const [query, setQuery] = useState('');
    const trimmedQuery = query.trim();
    const [debouncedQuery] = useDebounce(query.trim(), debounceMs);

    const enabled = debouncedQuery.length > 0;

    const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0];

    const queryKey = useMemo(
        () => ['item-search', debouncedQuery, locale, limit],
        [debouncedQuery, locale, limit]
    );

    const {data, isLoading, error} = useQuery({
        queryKey,
        queryFn: () =>
            fetchItemSearch(
                debouncedQuery,
                locale,
                limit
            ),
        enabled,
    });

    const clearResults = () => {
        setQuery('');
    };

    return {
        results: trimmedQuery.length === 0 ? [] : (data ?? []),
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
