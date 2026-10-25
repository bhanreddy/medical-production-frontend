import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthFrame } from './AuthFrame';
import { ArrowRight } from 'lucide-react';
import { uiSlice } from '../../state/slices';
import type { RootState } from '../../state/store';
import { CloudAuthService } from '../../services/cloudAuthService';
import type { AuthGate } from '../../services/authGateService';

export function SignupScreen({ onNavigate }: { onNavigate: (gate: AuthGate) => void }) {
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const { isLoading } = useSelector((s: RootState) => s.ui);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    dispatch(uiSlice.actions.setLoading(true));
    try {
      await CloudAuthService.signUpAndPersist({
        email: email.trim(),
        password,
        name: name.trim(),
        shopName: shopName.trim(),
        phone: phone.trim(),
      });
      onNavigate('payment');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      dispatch(uiSlice.actions.setLoading(false));
    }
  };

  return (
    <AuthFrame title="Create your account" subtitle="A new home for your pharmacy business.">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
          <Input label="Shop name" value={shopName} onChange={e => setShopName(e.target.value)} required />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            autoComplete="tel"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={error}
          />

          <Button type="submit" className="w-full h-12" isLoading={isLoading}>
            Create account <ArrowRight size={16} aria-hidden />
          </Button>
        </form>

        <p className="auth-switch">
          Already registered?{' '}
          <button
            type="button"
            className="underline-offset-2 hover:underline"
            onClick={() => onNavigate('login')}
          >
            Sign in
          </button>
        </p>
    </AuthFrame>
  );
}
