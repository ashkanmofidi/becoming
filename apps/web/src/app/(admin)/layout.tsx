import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Admin layout. PRD Section 10.1.
 * Cookie check only — role enforcement is done by the admin API routes
 * via requireRole() middleware. Server-side KV calls in layouts cause
 * 500 errors on Vercel serverless when KV connection fails.
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

  return <>{children}</>;
}
