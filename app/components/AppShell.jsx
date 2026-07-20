'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Avatar from './Avatar';
import ProfilePicker from './ProfilePicker';
import Calendar from './Calendar';
import VanInventory from './VanInventory';
import CurrentBookingBanner from './CurrentBookingBanner';
import DashboardOverview from './DashboardOverview';
import HomeView from './HomeView';
import ActivityFeed from './ActivityFeed';
import MemberSettings from './MemberSettings';
import MaintenanceView from './MaintenanceView';
import TripEndModal from './TripEndModal';
import Mountains from './decor/Mountains';
import SideDoodles from './decor/SideDoodles';
import { PineTreeIcon } from './decor/DoodleIcons';
import { buildActivity } from '../lib/activity';
import { getMaintenanceStatus } from '../lib/maintenance';
import { haptic } from '../lib/haptics';

const COOKIE_NAME = 'van_profile';
const LAST_SEEN_KEY = 'wouchi_last_seen';

function readCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
function writeCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

function AppShellInner({
  members: initialMembers,
  bookings: initialBookings,
  inventory: initialInventory,
  comments: initialComments,
  mileageLogs: initialMileageLogs,
  maintenanceItems: initialMaintenanceItems,
  activityClearedAt: initialActivityClearedAt,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [profileId, setProfileId] = useState(undefined);
  const [tab, setTab] = useState(['accueil', 'calendrier', 'van', 'activite', 'entretien'].includes(urlTab) ? urlTab : 'accueil');
  const [members, setMembers] = useState(initialMembers);
  const [bookings, setBookings] = useState(initialBookings);
  const [inventory, setInventory] = useState(initialInventory);
  const [comments, setComments] = useState(initialComments);
  const [mileageLogs, setMileageLogs] = useState(initialMileageLogs);
  const [maintenanceItems, setMaintenanceItems] = useState(initialMaintenanceItems);
  const [activityClearedAt, setActivityClearedAt] = useState(initialActivityClearedAt);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tripEndOpen, setTripEndOpen] = useState(false);
  const [hasNewActivity, setHasNewActivity] = useState(false);

  useEffect(() => {
    setProfileId(readCookie(COOKIE_NAME));
  }, []);

  const allActivity = buildActivity({ bookings, comments, inventory, members });
  const activity = activityClearedAt ? allActivity.filter((a) => a.timestamp > activityClearedAt) : allActivity;

  const currentKm = mileageLogs[0]?.km ?? null;
  const maintenanceDueCount = maintenanceItems.filter((item) => {
    const s = getMaintenanceStatus(item, currentKm).status;
    return s === 'retard' || s === 'bientot';
  }).length;

  useEffect(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    if (!lastSeen) {
      setHasNewActivity(activity.length > 0);
      return;
    }
    setHasNewActivity(activity.some((a) => a.timestamp > lastSeen));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.length]);

  if (profileId === undefined) {
    return null;
  }

  const currentMember = members.find((m) => m.id === profileId) || null;

  function chooseProfile(id) {
    writeCookie(COOKIE_NAME, id);
    setProfileId(id);
  }

  function changeTab(next) {
    haptic.select();
    setTab(next);
    router.replace(`/?tab=${next}`, { scroll: false });
    if (next === 'activite') {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setHasNewActivity(false);
    }
  }

  function handleClearActivity(clearedAt) {
    setActivityClearedAt(clearedAt);
  }

  return (
    <div>
      <Mountains />
      <div className="top-header">
        <div className="top-header-inner">
          <div className="brand brand-clickable" onClick={() => changeTab('accueil')} title="Retour à l'accueil">
            <h1>Wouchi</h1>
            <p>Interface de réservation</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {maintenanceDueCount > 0 && (
              <button
                className="header-maint-pill"
                onClick={() => changeTab('entretien')}
                title="Entretiens à prévoir"
              >
                🔧 {maintenanceDueCount}
              </button>
            )}
            <button
              className="btn small"
              aria-label="Faire le point sur le van"
              title="Faire le point sur le van"
              onClick={() => { haptic.tap(); setTripEndOpen(true); }}
            >
              📋
            </button>
            {currentMember && (
              <div className="current-user" onClick={() => { haptic.tap(); setProfileId(null); }} title="Changer de profil">
                <Avatar member={currentMember} />
                <span>{currentMember.name}</span>
              </div>
            )}
            <button className="btn small" aria-label="Réglages" onClick={() => { haptic.tap(); setSettingsOpen(true); }}>⚙️</button>
            <button
              className="btn small"
              onClick={async () => {
                haptic.tap();
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
            >
              Quitter
            </button>
          </div>
        </div>
      </div>

      <SideDoodles tab={tab} />

      <div className="wrap">
        <CurrentBookingBanner
          bookings={bookings}
          members={members}
          inventory={inventory}
          onOpenTripEnd={() => setTripEndOpen(true)}
          showChecklist={tab !== 'accueil'}
        />

        {tab !== 'accueil' && (
          <DashboardOverview
            maintenanceItems={maintenanceItems}
            currentKm={currentKm}
            inventory={inventory}
            onGoToTab={changeTab}
          />
        )}

        {tab !== 'accueil' && (
          <div className="tabs">
            <button className={`tab${tab === 'accueil' ? ' active' : ''}`} onClick={() => changeTab('accueil')}>
              <span>🏠</span> Accueil
            </button>
            <button className={`tab${tab === 'calendrier' ? ' active' : ''}`} onClick={() => changeTab('calendrier')}>
              <span>📅</span> Calendrier
            </button>
            <button className={`tab${tab === 'van' ? ' active' : ''}`} onClick={() => changeTab('van')}>
              <PineTreeIcon size={15} color={tab === 'van' ? '#C1622D' : '#8A6F4E'} /> Le van
            </button>
            <button className={`tab${tab === 'activite' ? ' active' : ''}`} onClick={() => changeTab('activite')}>
              <span>📖</span> Activité
              {hasNewActivity && <span className="tab-dot" />}
            </button>
            <button className={`tab${tab === 'entretien' ? ' active' : ''}`} onClick={() => changeTab('entretien')}>
              <span>🔧</span> Entretien
              {maintenanceDueCount > 0 && <span className="zone-tab-count">{maintenanceDueCount}</span>}
            </button>
          </div>
        )}

        {tab === 'accueil' && <HomeView activity={activity} onGoToTab={changeTab} />}
        {tab === 'calendrier' && (
          <Calendar
            members={members}
            bookings={bookings}
            onBookingsChange={setBookings}
            comments={comments}
            onCommentsChange={setComments}
            currentMember={currentMember}
          />
        )}
        {tab === 'van' && (
          <VanInventory
            items={inventory}
            onItemsChange={setInventory}
            comments={comments}
            onCommentsChange={setComments}
            members={members}
            currentMember={currentMember}
          />
        )}
        {tab === 'activite' && <ActivityFeed activity={activity} onClear={handleClearActivity} />}
        {tab === 'entretien' && (
          <MaintenanceView
            mileageLogs={mileageLogs}
            onMileageLogsChange={setMileageLogs}
            maintenanceItems={maintenanceItems}
            onMaintenanceItemsChange={setMaintenanceItems}
            currentMember={currentMember}
          />
        )}
      </div>

      {!currentMember && <ProfilePicker members={members} onChoose={chooseProfile} />}
      {settingsOpen && (
        <MemberSettings members={members} onMembersChange={setMembers} onClose={() => setSettingsOpen(false)} />
      )}
      {tripEndOpen && (
        <TripEndModal
          items={inventory}
          onItemsChange={setInventory}
          currentMember={currentMember}
          onClose={() => setTripEndOpen(false)}
        />
      )}
    </div>
  );
}

export default function AppShell(props) {
  return (
    <Suspense fallback={null}>
      <AppShellInner {...props} />
    </Suspense>
  );
}
