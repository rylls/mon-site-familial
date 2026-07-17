import AppShell from './components/AppShell';
import { getMembers, getBookings, getInventory, getComments } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [members, bookings, inventory, comments] = await Promise.all([
    getMembers(),
    getBookings(),
    getInventory(),
    getComments(),
  ]);

  return <AppShell members={members} bookings={bookings} inventory={inventory} comments={comments} />;
}
