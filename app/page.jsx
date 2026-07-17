import AppShell from './components/AppShell';
import { getMembers, getBookings, getInventory } from './actions';

export default async function Page() {
  const [members, bookings, inventory] = await Promise.all([
    getMembers(),
    getBookings(),
    getInventory(),
  ]);

  return <AppShell members={members} bookings={bookings} inventory={inventory} />;
}
