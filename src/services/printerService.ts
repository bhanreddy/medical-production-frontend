import api from '../lib/api';
import type { Sale, SaleItem, ShopProfile } from '../core/types';
import { ShopProfileService } from './shopProfileService';
import { printBill } from '../utils/printBill';
import { BILL_PRINT_HALF_PAGE_MAX_ITEMS } from '../components/Billing/BillPrintLayout';

/**
 * PHASE 14: PRINT ENGINE
 * Handles formatting and dispatching print jobs.
 * Supports Thermal Printers (80mm / 58mm).
 * Online-First: Uses ShopProfile Service.
 */
export const PrinterService = {

    async printBill(sale: Sale, items: SaleItem[]) {
        try {
            // 1. Fetch Authoritative Header Info (Local Cache) - WITH FALLBACK
            let profile: ShopProfile;
            try {
                profile = await ShopProfileService.getShopProfileLocal();
            } catch (err) {
                console.warn("Print: Shop profile missing, using fallback.");
                profile = {
                    id: '00000000-0000-0000-0000-000000000000',
                    shop_id: 'fallback',
                    medical_name: 'Medical Profile Unavailable',
                    owner_name: 'Unknown',
                    gst_number: 'N/A',
                    drug_license_number: 'N/A',
                    address_line_1: 'Profile data missing from device',
                    city: '-',
                    state: '-',
                    pincode: '-',
                    phone_number: '',
                    verified: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_modified: 0,
                    last_fetched_at: new Date().toISOString()
                };
            }

            // 2. Fetch Customer if attached
            let customerName = undefined;
            let customerPhone = undefined;
            if (sale.customer_id) {
                try {
                    const custRes = await api.get(`/customers/${sale.customer_id}`);
                    customerName = custRes.data?.data?.name;
                    customerPhone = custRes.data?.data?.phone;
                } catch (e) {
                    console.warn("Failed to fetch customer for print");
                }
            }

            // 3. Hydrate Items (Fetch Name & Batch Info)
            const enrichedItems = await Promise.all(items.map(async (item: any) => {
                let productName = item.medicines?.name || '';
                let batchNumber = item.medicine_batches?.batch_number || '';
                let expiryDate = item.medicine_batches?.expiry_date || '';

                if (!productName || !batchNumber) {
                    try {
                        const medRes = await api.get(`/inventory/medicines/${item.medicine_id || item.product_id}`);
                        const med = medRes.data?.data;
                        productName = med?.name || productName || 'Unknown Product';
                        
                        const batch = med?.batches?.find((b: any) => (b.id || b._local_id) === (item.batch_id || item.batchId));
                        batchNumber = batch?.batch_number || batchNumber || 'N/A';
                        expiryDate = batch?.expiry_date || expiryDate || 'N/A';
                    } catch (e) {
                        console.warn("Failed to fetch medicine for print", e);
                        productName = productName || 'Unknown Product';
                        batchNumber = batchNumber || 'N/A';
                        expiryDate = expiryDate || 'N/A';
                    }
                }

                return {
                    batch: {
                        batch_number: batchNumber,
                        expiry_date: expiryDate
                    },
                    productName,
                    quantity: item.quantity,
                    unitPrice: item.unit_price || item.mrp || 0,
                    total: item.total_amount || item.total || 0,
                    gstRate: item.gst_rate || 0
                };
            }));

            // 4. Trigger Print via Robust Utility
            printBill({
                shopProfile: profile,
                customerName,
                customerPhone,
                invoiceNumber: sale.invoice_number,
                date: new Date(sale.created_at).toLocaleString(),
                items: enrichedItems,
                subtotal: sale.total_amount,
                gstAmount: sale.tax_amount,
                discount: sale.discount_amount,
                finalTotal: sale.final_amount,
                printHalfPage: enrichedItems.length <= BILL_PRINT_HALF_PAGE_MAX_ITEMS,
            });

        } catch (error) {
            console.error("Print failed:", error);
            alert("Printing failed. Ensure shop profile is synced.");
        }
    }
}