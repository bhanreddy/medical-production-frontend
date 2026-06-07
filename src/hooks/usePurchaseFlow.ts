import { useState, useCallback } from 'react';
import api from '../lib/api';
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '../core/types';

export interface PurchaseItemDraft {
    id: string; // Temp ID for draft manipulation
    product: Product;
    batchNumber: string;
    expiryDate: string; // YYYY-MM-DD
    quantity: number;
    costPrice: number;
    mrp: number;
    total: number;
}

export const usePurchaseFlow = () => {
    const [vendorId, setVendorId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<PurchaseItemDraft[]>([]);

    const [isCommitting, setIsCommitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDraft, setIsDraft] = useState(true);

    const addItem = useCallback((item: Omit<PurchaseItemDraft, 'id' | 'total'>) => {
        const newItem: PurchaseItemDraft = {
            ...item,
            id: uuidv4(),
            total: item.quantity * item.costPrice
        };
        setItems(prev => [...prev, newItem]);
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const resetDraft = useCallback(() => {
        setVendorId('');
        setInvoiceNumber('');
        setInwardDate(new Date().toISOString().split('T')[0]);
        setItems([]);
        setIsDraft(true);
        setError(null);
    }, []);

    const commitToLedger = async () => {
        if (!vendorId) {
            setError("Vendor is required.");
            return;
        }
        if (!invoiceNumber) {
            setError("Invoice Number is required.");
            return;
        }
        if (items.length === 0) {
            setError("No items to commit.");
            return;
        }

        setIsCommitting(true);
        setError(null);

        try {
            const payload = {
                supplier_id: vendorId,
                invoice_number: invoiceNumber,
                invoice_date: inwardDate,
                bill_image_url: '',
                notes: 'Created via Web Client POS',
                items: items.map(item => ({
                    medicine_id: item.product.id,
                    batch_number: item.batchNumber,
                    expiry_date: item.expiryDate,
                    quantity: item.quantity,
                    purchase_price: item.costPrice,
                    mrp: item.mrp,
                    gst_rate: item.product.gst_rate || 0,
                    discount: 0
                }))
            };

            await api.post('/purchases', payload);
            setIsDraft(false);

        } catch (err: any) {
            console.error("Commit failed", err);
            setError(err.response?.data?.error || err.message || "Commit Failed");
        } finally {
            setIsCommitting(false);
        }
    };

    return {
        vendorId, setVendorId,
        invoiceNumber, setInvoiceNumber,
        inwardDate, setInwardDate,
        items,
        addItem, removeItem,
        commitToLedger,
        isCommitting,
        error,
        isDraft,
        resetDraft
    };
};
