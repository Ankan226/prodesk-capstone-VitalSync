'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAuthStore, type Role } from '@/lib/auth-store';

interface NavItem {
  label: string;
  href?: string; 
}

const NAV: Record<Role, NavItem[]> = {
  patient: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Find Doctor', href: '/dashboard/book' },
    { label: 'Appointments', href: '/dashboard/appointments' },
    { label: 'Medical History' },
    { label: 'Prescriptions' },
    { label: 'Profile' },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor/dashboard' },
    { label: 'Availability', href: '/doctor/availability' },
    { label: 'Patients' },
    { label: 'Prescriptions' },
  ],
  admin: [{ label: 'Doctor Approvals', href: '/admin/dashboard' }, { label: 'Users' }, { label: 'Audit Log' }],
};

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function DashboardShell({ title, subtitle, actions, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = user ? NAV[user.role] : [];


  
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  function onLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 md:flex-row">
      <aside className="border-b border-gray-200 bg-white md:flex md:min-h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-xl font-bold text-blue-600">VitalSync</span>
          {/* Hamburger: only on small screens */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            className="rounded p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        <nav
          id="main-nav"
          aria-label="Main"
          className={`${menuOpen ? 'flex' : 'hidden'} flex-col gap-1 px-3 pb-3 md:flex md:flex-1`}
        >
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`rounded px-3 py-2 text-sm transition-colors ${
                  isActive(item.href) ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center justify-between gap-2 rounded px-3 py-2 text-sm text-gray-400"
              >
                {item.label}
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">Soon</span>
              </span>
            )
          )}
          <button
            onClick={onLogout}
            className="rounded px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
          >
            Log out
          </button>
        </nav>

        <div className="hidden border-t border-gray-200 p-3 md:block">
          <button onClick={onLogout} className="w-full rounded px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="text-right text-sm">
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs capitalize text-gray-500">{user?.role}</div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}