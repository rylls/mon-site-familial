import AppShell from './components/AppShell';
import { getMembers, getBookings, getInventory, getComments, getMileageLogs, getMaintenanceItems, getAppSetting, getImportantInfo, getIdeas } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [members, bookings, inventory, comments, mileageLogs, maintenanceItems, activityClearedAt, importantInfo, ideas] = await Promise.all([
    getMembers(),
    getBookings(),
    getInventory(),
    getComments(),
    getMileageLogs(),
    getMaintenanceItems(),
    getAppSetting('activity_cleared_at'),
    getImportantInfo(),
    getIdeas(),
  ]);

  return (
    <AppShell
      members={members}
      bookings={bookings}
      inventory={inventory}
      comments={comments}
      mileageLogs={mileageLogs}
      maintenanceItems={maintenanceItems}
      activityClearedAt={activityClearedAt}
      importantInfo={importantInfo}
      ideas={ideas}
    />
  );
}
