import api from '../lib/api';
import type { Supplier } from '../core/types';

export const SupplierService = {

    async getAll(): Promise<Supplier[]> {
        const res = await api.get('/suppliers?limit=200');
        return res.data?.data || [];
    },

    async getActive(): Promise<Supplier[]> {
        const res = await api.get('/suppliers?limit=200');
        return (res.data?.data || []).filter((s: any) => s.is_active);
    },

    async addSupplier(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'last_modified' | 'is_active'>): Promise<Supplier> {
        const res = await api.post('/suppliers', data);
        const created = res.data?.data;
        return {
            ...created,
            id: created._local_id || created.id
        };
    },

    async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
        await api.put(`/suppliers/${id}`, updates);
    },

    async toggleActive(id: string, isActive: boolean): Promise<void> {
        await this.updateSupplier(id, { is_active: isActive });
    }
};
