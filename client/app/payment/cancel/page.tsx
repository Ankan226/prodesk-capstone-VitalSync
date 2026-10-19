import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <main className="mx-auto mt-16 max-w-md rounded border border-gray-300 p-6 text-center">
      <h1 className="mb-2 text-xl font-bold">Payment cancelled</h1>
      <p className="mb-4 text-sm">No money was taken. You can pay any time from your dashboard.</p>
      <Link href="/dashboard" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
        Back to dashboard
      </Link>
    </main>
  );
}