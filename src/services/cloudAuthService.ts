import { supabase } from '../lib/supabase';
import api from '../lib/api';
import {
  getPersistedSupabaseSession,
  getSubscriptionCache,
  setPersistedSupabaseSession,
  setSubscriptionCache,
  type PersistedSupabaseSession,
  type SubscriptionEntitlementCache,
} from '../lib/store';
import { AuthService } from './authService';
import type { User, AuthSession } from '../core/types';
import { fetchSubscriptionStatus } from './subscriptionApi';
import { store } from '../state/store';
import { authSlice } from '../state/slices';

const CLOUD_SESSION_MS = 10 * 365 * 24 * 60 * 60 * 1000;

function sessionToPersisted(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}): PersistedSupabaseSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

export const CloudAuthService = {
  async hydrateSupabaseFromStore(): Promise<boolean> {
    const persisted = await getPersistedSupabaseSession();
    if (!persisted?.access_token || !persisted.refresh_token) return false;

    const { error } = await supabase.auth.setSession({
      access_token: persisted.access_token,
      refresh_token: persisted.refresh_token,
    });

    if (!error) return true;

    const refreshed = await supabase.auth.refreshSession({
      refresh_token: persisted.refresh_token,
    });
    if (refreshed.error || !refreshed.data.session) {
      await setPersistedSupabaseSession(null);
      return false;
    }
    await setPersistedSupabaseSession(sessionToPersisted(refreshed.data.session));
    return true;
  },

  /**
   * Opens the local POS session (Redux) for the current Supabase user by fetching
   * the authenticated user details directly from the Express API `/auth/me`.
   */
  async ensurePosSessionFromCloud(): Promise<boolean> {
    try {
      const { data: supa } = await supabase.auth.getSession();
      const s = supa.session;
      if (!s?.user?.id) return false;

      // Fetch the logged-in user profile from the backend Express API /auth/me directly
      const { data } = await api.get('/auth/me');
      const backendUser = data?.user;
      if (!backendUser || backendUser.id !== s.user.id) {
        return false;
      }

      // Map backendUser and Supabase session to the Redux user & session payloads
      const mappedUser: User = {
        id: backendUser.id,
        username: backendUser.email || s.user.email || '',
        password_hash: '', // Cleaned: no longer storing password hashes on the client
        role_id: backendUser.role || 'OWNER',
        name: s.user.user_metadata?.full_name || s.user.user_metadata?.name || backendUser.name || backendUser.email?.split('@')[0] || 'Operator',
        is_active: true,
        created_at: s.user.created_at || new Date().toISOString(),
        updated_at: s.user.updated_at || new Date().toISOString(),
        last_modified: Date.now(),
      };

      const mappedSession: AuthSession = {
        id: s.access_token.slice(-36) || backendUser.id, // client-generated UUID or token chunk
        user_id: backendUser.id,
        role_id: backendUser.role || 'OWNER',
        permissions: ['ALL'], // Simplified online permissions
        expires_at: s.expires_at ? s.expires_at * 1000 : Date.now() + CLOUD_SESSION_MS,
        is_offline_session: false,
        token: s.access_token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_modified: Date.now(),
      };

      store.dispatch(authSlice.actions.loginSuccess({ user: mappedUser, session: mappedSession }));
      return true;
    } catch (err) {
      console.error('[CloudAuthService] ensurePosSessionFromCloud failed:', err);
      return false;
    }
  },

  async persistSessionFromClient(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s?.access_token || !s.refresh_token) {
      await setPersistedSupabaseSession(null);
      return;
    }
    await setPersistedSupabaseSession(sessionToPersisted(s));
  },

  async signUpAndPersist(params: {
    email: string;
    password: string;
    name: string;
    shopName: string;
    phone: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.name,
          shop_name: params.shopName,
          phone: params.phone,
        },
      },
    });
    if (error) throw error;
    if (!data.session) {
      throw new Error(
        'No session after sign up. If email confirmation is enabled in Supabase, disable it for this desktop flow or confirm the email before continuing.'
      );
    }
    await setPersistedSupabaseSession(sessionToPersisted(data.session));
    return data;
  },

  async signInAndPersist(params: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error('Sign-in failed');
    await setPersistedSupabaseSession(sessionToPersisted(data.session));
    return data;
  },

  async applySubscriptionCacheFromServer(): Promise<SubscriptionEntitlementCache> {
    const remote = await fetchSubscriptionStatus();
    const prev = (await getSubscriptionCache()) ?? null;

    const entitled = prev?.entitled === true || remote.status === 'active';

    const cache: SubscriptionEntitlementCache = {
      entitled,
      plan: remote.plan ?? undefined,
      expiresAt: remote.expires_at,
      lastServerStatus: remote.status,
      lastCheckedAt: new Date().toISOString(),
      showRenewalBanner: entitled && remote.status === 'expired',
    };

    if (remote.status === 'active') {
      cache.showRenewalBanner = false;
    }

    await setSubscriptionCache(cache);
    return cache;
  },

  async logoutEverywhere(): Promise<void> {
    await AuthService.logout();
  },

  async onPaymentVerified(params: { plan: 'monthly' | 'yearly'; expiresAt: string | null }) {
    const cache: SubscriptionEntitlementCache = {
      entitled: true,
      plan: params.plan,
      expiresAt: params.expiresAt,
      lastServerStatus: 'active',
      lastCheckedAt: new Date().toISOString(),
      showRenewalBanner: false,
    };
    await setSubscriptionCache(cache);
    const ok = await this.ensurePosSessionFromCloud();
    if (!ok) {
      throw new Error(
        'Payment verified but the POS session could not start. Sign out, sign in again, then contact support if this persists.',
      );
    }
  },
};

