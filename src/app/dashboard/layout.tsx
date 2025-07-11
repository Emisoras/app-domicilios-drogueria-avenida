import type { ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserByCedula } from '@/actions/user-actions';
import type { User } from '@/types';
import { ReactNode } from 'react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const currentUser = await getUserByCedula(session.userId);

  if (!currentUser) {
    redirect('/');
  }


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar user={currentUser} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 flex-1">
        <Header user={currentUser} />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
