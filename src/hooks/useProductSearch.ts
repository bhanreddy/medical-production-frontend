import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Product, Batch } from '../core/types';
import {
    computeSearchResultForProduct,
    readAllowExpiredSale,
    type SearchResult,
} from '../services/productLookupService';

export type { SearchResult };

export const useProductSearch = (query: string) => {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    // 1. Debounce the input (150ms)
    // This prevents the search from firing on every keystroke during fast typing
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 150);
        return () => clearTimeout(handler);
    }, [query]);

    // 2. React to debounced input
    useEffect(() => {
        const trimmed = debouncedQuery.trim();

        // SCANNER DETECTION RULE for Sticky Search:
        // If numeric and >= 3 chars, assume it's a barcode scan attempt.
        // We do NOT search in that case to avoid UI flicker during scan.
        const isNumeric = /^\d+$/.test(trimmed);

        // Clear results ONLY if:
        // 1. Input is empty
        // 2. Input is too short (< 2 chars) for meaningful search
        // 3. Input is a barcode scan (numeric >= 3)
        if (!trimmed || trimmed.length < 2 || (isNumeric && trimmed.length >= 3)) {
            setResults([]);
            return;
        }

        const runSearch = async () => {
            setIsSearching(true);
            try {
                // Fetch medicines matching search query from backend
                const res = await api.get(`/inventory/medicines/search?q=${encodeURIComponent(trimmed)}`);
                const matchedMedicines = res.data?.results || [];

                const products: Product[] = [];
                const batches: Batch[] = [];
                const inventoryMap = new Map<string, number>();

                matchedMedicines.forEach((m: any) => {
                    const mappedProduct: Product = {
                        id: m.id,
                        _local_id: m._local_id || m.id,
                        name: m.name,
                        composition: m.generic_name || m.composition || '',
                        manufacturer: m.manufacturer || '',
                        type: m.type || 'TABLET',
                        hsn_code: m.hsn_code || '',
                        gst_rate: Number(m.gst_rate || 0),
                        min_stock_alert: Number(m.low_stock_threshold || m.min_stock_alert || 5),
                        is_active: m.is_active === 1 || m.is_active === true,
                        created_at: m.created_at,
                        updated_at: m.updated_at,
                        last_modified: Date.now()
                    };
                    products.push(mappedProduct);

                    if (m.medicine_batches) {
                        m.medicine_batches.forEach((b: any) => {
                            if (b.is_disposed === true || b.is_disposed === 1) return;
                            const batchId = b._local_id || b.id;
                            batches.push({
                                id: batchId,
                                _local_id: batchId,
                                product_id: b.medicine_id || b.product_id || m.id,
                                purchase_id: b.purchase_id || '',
                                batch_number: b.batch_number,
                                mrp: Number(b.mrp || 0),
                                purchase_rate: Number(b.purchase_price || b.purchase_rate || 0),
                                sales_rate: Number(b.sales_rate || b.mrp || 0),
                                expiry_date: b.expiry_date || new Date().toISOString().split('T')[0],
                                created_at: b.created_at,
                                updated_at: b.updated_at,
                                last_modified: Date.now()
                            });
                            inventoryMap.set(batchId, Number(b.quantity_remaining || 0));
                        });
                    }
                });

                if (products.length === 0) {
                    setResults([]);
                    return;
                }

                const today = new Date().toISOString().split('T')[0];
                const allowExpired = await readAllowExpiredSale();

                const searchResults: SearchResult[] = products.map((product: Product) => {
                    const productBatches = batches.filter((b: Batch) => b.product_id === product.id);
                    return computeSearchResultForProduct(product, productBatches, inventoryMap, allowExpired, today);
                });

                // Rule: Sort by In-Stock first, then Name
                searchResults.sort((a, b) => {
                    if (a.totalStock > 0 && b.totalStock <= 0) return -1;
                    if (a.totalStock <= 0 && b.totalStock > 0) return 1;
                    return a.product.name.localeCompare(b.product.name);
                });

                setResults(searchResults); // Atomic replacement
            } catch (error) {
                console.error("Search failed", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        void runSearch();

    }, [debouncedQuery]);

    return { results, isSearching };
};
