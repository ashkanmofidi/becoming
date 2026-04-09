import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authService } from '@/services/auth.service';

/**
 * Admin layout. PRD Section 10.1.
 * Role-gated: completely absent for regular users.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('bm_sid')?.value;

  if (!token) {
    redirect('/login');
  }

  const session = await authService.validateSession(token);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/timer?error=forbidden');
  }

  return <>{children}</>;
}
