import { store } from '../state/store';
import { authSlice } from '../state/slices';
import { clearStockAlertPopupSession } from '../utils/stockAlertSession';

export const AuthService = {
    async logout() {
        try {
            const { supabase } = await import('../lib/supabase');
            await supabase.auth.signOut();
        } catch {
            /* non-fatal */
        }
        try {
            const { clearAllAuthPersistence } = await import('../lib/store');
            await clearAllAuthPersistence();
        } catch {
            /* non-fatal */
        }
        clearStockAlertPopupSession();
        store.dispatch(authSlice.actions.logout());
    }
};

