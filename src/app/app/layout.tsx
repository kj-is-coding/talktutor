import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { BottomNav } from '@/components/bottom-nav';
import { Sidebar } from '@/components/sidebar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 md:ml-[220px]">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
