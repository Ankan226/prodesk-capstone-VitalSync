'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/helpers';

function SuccessContent() {
  const [state, setState] = useState<'checking' | 'paid' | 'failed'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) {
      setState('failed');
      setMessage('No payment session was found in this link.');
      return;
    }
    
    
    api<{ status: string }>(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then((d) => {
        setState(d.status === 'paid' ? 'paid' : 'failed');
        if (d.status !== 'paid') setMessage('Stripe has not confirmed this payment yet.');
      })
      .catch((e) => {
        setState('failed');
        setMessage(errorMessage(e));
      });
  }, []);

  return (
    <main className="mx-auto mt-16 max-w-md rounded border border-gray-300 p-6 text-center">
      {state === 'checking' && <p className="text-sm">Confirming your payment...</p>}
      {state === 'paid' && (
        <>
          <h1 className="mb-2 text-xl font-bold text-green-700">Payment successful</h1>
          <p className="mb-4 text-sm">Thank you. Your appointment is confirmed and marked as paid.</p>
        </>
      )}
      {state === 'failed' && (
        <>
          <h1 className="mb-2 text-xl font-bold text-red-700">We could not confirm the payment</h1>
          <p className="mb-4 text-sm">{message}</p>
        </>
      )}
      <Link href="/dashboard" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
        Back to dashboard
      </Link>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <ProtectedRoute roles={['patient']}>
      <SuccessContent />
    </ProtectedRoute>
  );
}