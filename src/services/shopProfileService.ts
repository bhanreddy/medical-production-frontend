import api from '../lib/api';
import type { ShopProfile } from '../core/types';

export const ShopProfileService = {

    /**
     * Fetch from Supabase (Authoritative)
     */
    async fetchShopProfileOnline(): Promise<Partial<ShopProfile> | null> {
        console.log(`[Online] Fetching shop profile from /clinics/me ...`);

        try {
            const response = await api.get('/clinics/me');
            const data = response.data;
            console.log('[ShopProfile] API response:', JSON.stringify(data).slice(0, 300));
            
            if (data?.data) {
                const profile = data.data;
                return {
                    id: profile.id,
                    shop_id: profile.id,
                    medical_name: profile.name,
                    owner_name: profile.owner_name,
                    gst_number: profile.gstin,
                    drug_license_number: profile.drug_licence_number,
                    address_line_1: profile.address,
                    address_line_2: '',
                    city: '',
                    state: '',
                    pincode: '',
                    logo_url: profile.logo_url,
                    phone_number: profile.phone,
                    verified: profile.is_active,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at
                };
            }
            console.warn('[ShopProfile] API returned OK but no data.data:', data);
        } catch (err: any) {
            const status = err?.response?.status;
            const body = err?.response?.data;
            console.error('[ShopProfile] Online fetch failed:', { status, body, message: err?.message });
        }
        return null;
    },

    /**
     * Sync: Fetch Online
     */
    async syncShopProfile(): Promise<ShopProfile> {
        const onlineData = await this.fetchShopProfileOnline();
        if (onlineData) {
            return onlineData as ShopProfile;
        }
        throw new Error('Medical profile not available. Please connect to internet once.');
    },

    async getShopProfileLocal(): Promise<ShopProfile> {
        const profile = await this.fetchShopProfileOnline();
        if (!profile) {
            throw new Error('Medical Profile missing. Please login online to sync.');
        }
        return profile as ShopProfile;
    },

    /**
     * Update Phone Number Logic
     */
    async updatePhoneNumber(newPhone: string): Promise<void> {
        await api.put('/clinics/me', { phone: newPhone });
    },

    /**
     * Update Logo Locally
     */
    async updateLogo(base64Data: string): Promise<void> {
        await api.put('/clinics/me', { logo_url: base64Data });
    }
};
