import api from '../lib/api';
import type { Product, Batch } from '../core/types';

/** Billing / barcode / name search: stock snapshot aligned with sale allocation (FEFO, sellable batches). */
export interface SearchResult {
    product: Product;
    /** Quantity sellable under current expiry rules (matches allocateStock). */
    totalStock: number;
    batchCount: number;
    nearestExpiry: string | null;
    /** First FEFO batch that has qty > 0 (never an empty early-expiry batch). */
    bestBatchId: string | null;
}

export async function readAllowExpiredSale(): Promise<boolean> {
    return false; // Default safe for online-first
}

export function matchesEntityId(
    entity: { id?: string; _local_id?: string },
    targetId: string | null | undefined,
): boolean {
    if (!targetId) return false;
    return entity.id === targetId || entity._local_id === targetId;
}

export type MedicineBatchRow = {
    id?: string;
    _local_id?: string;
    quantity_remaining?: number;
    expiry_date?: string;
    batch_number?: string;
    mrp?: number;
    sales_rate?: number;
    purchase_price?: number;
    purchase_rate?: number;
    is_disposed?: boolean | number;
};

/** Pick the FEFO sellable batch from a medicine detail response. */
export function resolveBatchFromMedicineDetail(
    batches: MedicineBatchRow[],
    bestBatchId: string | null,
    allowExpired = false,
): MedicineBatchRow | null {
    const today = new Date().toISOString().split('T')[0];
    const sellable = batches
        .filter(batch => {
            if (batch.is_disposed === true || batch.is_disposed === 1) return false;
            const qty = Number(batch.quantity_remaining ?? 0);
            if (qty <= 0) return false;
            if (!allowExpired && batch.expiry_date && batch.expiry_date < today) return false;
            return true;
        })
        .sort((a, b) => String(a.expiry_date ?? '').localeCompare(String(b.expiry_date ?? '')));

    if (bestBatchId) {
        const preferred = sellable.find(batch => matchesEntityId(batch, bestBatchId));
        if (preferred) return preferred;
    }

    return sellable[0] ?? null;
}

/**
 * Pick default batch and totals for POS: FEFO among batches that actually have stock.
 * Aligns with InventoryService.allocateStock (expiry + allow_expired_sale).
 */
export function computeSearchResultForProduct(
    product: Product,
    productBatches: Batch[],
    inventoryMap: Map<string, number>,
    allowExpired: boolean,
    today: string
): SearchResult {
    const stockedSellable: (Batch & { qty: number })[] = [];
    let sellableTotal = 0;

    for (const batch of productBatches) {
        if ((batch as Batch & { is_disposed?: boolean }).is_disposed) continue;
        const qty = inventoryMap.get(batch.id) || 0;
        const expired = batch.expiry_date < today;
        if (expired && !allowExpired) continue;

        sellableTotal += qty;
        if (qty > 0) {
            stockedSellable.push({ ...batch, qty });
        }
    }

    stockedSellable.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

    return {
        product,
        totalStock: sellableTotal,
        batchCount: stockedSellable.length,
        nearestExpiry: stockedSellable[0]?.expiry_date ?? null,
        bestBatchId: stockedSellable[0]?.id ?? null,
    };
}

/**
 * Resolve barcode / SKU from product.barcode or batch.barcode.
 */
export const ProductLookupService = {
    async findByBarcode(barcode: string): Promise<SearchResult | null> {
        const trimmed = barcode.trim();
        if (!trimmed) return null;

        try {
            const res = await api.get(`/inventory/medicines/search?barcode=${encodeURIComponent(trimmed)}`);
            const matched = res.data?.results || [];
            if (matched.length === 0) return null;

            const m = matched[0];
            const product: Product = {
                id: m.id,
                _local_id: m._local_id || m.id,
                name: m.name,
                composition: m.generic_name || m.composition || '',
                manufacturer: m.manufacturer || '',
                type: m.type || 'TABLET',
                hsn_code: m.hsn_code || '',
                gst_rate: Number(m.gst_rate || 0),
                min_stock_alert: Number(m.low_stock_threshold || 10),
                is_active: true,
                created_at: m.created_at,
                updated_at: m.updated_at,
                last_modified: Date.now()
            };

            const batches: Batch[] = [];
            const inventoryMap = new Map<string, number>();

            if (m.medicine_batches) {
                m.medicine_batches.forEach((b: any) => {
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

            const today = new Date().toISOString().split('T')[0];
            const allowExpired = await readAllowExpiredSale();

            return computeSearchResultForProduct(product, batches, inventoryMap, allowExpired, today);
        } catch (e) {
            console.error("Barcode lookup failed", e);
            return null;
        }
    },
};
