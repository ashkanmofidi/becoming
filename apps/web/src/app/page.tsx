import { redirect } from 'next/navigation';

/** Root page redirects to timer (authenticated) or login. */
export default function Home() {
  redirect('/timer');
}
