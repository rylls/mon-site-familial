'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Avatar from './Avatar';
import ProfilePicker from './ProfilePicker';
import Calendar from './Calendar';
import VanInventory from './VanInventory';
import CurrentBookingBanner from './CurrentBookingBanner';
import HomeView from './HomeView';
import ActivityFeed from './ActivityFeed';
import MemberSettings from './MemberSettings';
import MaintenanceView from './MaintenanceView';
import TripEndModal from './TripEndModal';
import NotificationBell from './NotificationBell';
import HeaderMenu from './HeaderMenu';
import IdeaBox from './IdeaBox';
import { ToastProvider } from './ToastProvider';
import Mountains from './decor/Mountains';
import SideDoodles from './decor/SideDoodles';
import { PineTreeIcon } from './decor/DoodleIcons';
import { buildActivity } from '../lib/activity';
import { getMaintenanceStatus, STATUS_LABELS } from '../lib/maintenance';
import { parseDate, startOfToday } from '../lib/dates';
import { haptic } from '../lib/haptics';
import { useRealtimeRefresh } from '../lib/useRealtimeRefresh';
import {
  getMembers,
  getBookings,
  getInventory,
  getComments,
  getMileageLogs,
  getMaintenanceItems,
  getImportantInfo,
  getIdeas,
} from '../actions';

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
  importantInfo: initialImportantInfo,
  ideas: initialIdeas,
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
  const [importantInfo, setImportantInfo] = useState(initialImportantInfo || []);
  const [ideas, setIdeas] = useState(initialIdeas || []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tripEndOpen, setTripEndOpen] = useState(false);
  const [tripEndBooking, setTripEndBooking] = useState(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const autoTripEndShownRef = useState(() => new Set())[0];

  useEffect(() => {
    setProfileId(readCookie(COOKIE_NAME));
  }, []);

  // Synchro en direct : si un autre appareil ajoute/modifie/supprime une
  // réservation, un objet d'inventaire, etc., on redemande juste la liste à
  // jour plutôt que de forcer un rechargement de page.
  useRealtimeRefresh('members', () => getMembers().then(setMembers));
  useRealtimeRefresh('bookings', () => getBookings().then(setBookings));
  useRealtimeRefresh('inventory_items', () => getInventory().then(setInventory));
  useRealtimeRefresh('comments', () => getComments().then(setComments));
  useRealtimeRefresh('mileage_logs', () => getMileageLogs().then(setMileageLogs));
  useRealtimeRefresh('maintenance_items', () => getMaintenanceItems().then(setMaintenanceItems));
  useRealtimeRefresh('important_info', () => getImportantInfo().then(setImportantInfo));
  useRealtimeRefresh('ideas', () => getIdeas().then(setIdeas));

  const allActivity = buildActivity({ bookings, comments, inventory, members });
  const activity = activityClearedAt ? allActivity.filter((a) => a.timestamp > activityClearedAt) : allActivity;

  const today = startOfToday();
  const isVanOut = bookings.some((b) => parseDate(b.start_date) <= today && today <= parseDate(b.end_date));
  const currentMaintenanceBooking = bookings.find((b) => b.type === 'maintenance' && parseDate(b.start_date) <= today && today <= parseDate(b.end_date));

  const currentMember = members.find((m) => m.id === profileId) || null;
  useEffect(() => {
    if (!currentMember) return;
    const pending = bookings.find((b) => {
      if (b.type === 'maintenance' || b.member_id !== currentMember.id || b.trip_end_ack) return false;
      const daysSinceEnd = Math.round((today - parseDate(b.end_date)) / 86400000);
      return daysSinceEnd > 0 && daysSinceEnd <= 3;
    });
    if (pending && !autoTripEndShownRef.has(pending.id)) {
      autoTripEndShownRef.add(pending.id);
      setTripEndBooking(pending);
      setTripEndOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMember?.id, bookings]);

  const currentKm = mileageLogs[0]?.km ?? null;
  const maintenanceDueCount = maintenanceItems.filter((item) => {
    const s = getMaintenanceStatus(item, currentKm).status;
    return s === 'retard' || s === 'bientot';
  }).length;

  const notifications = [];
  if (currentMember) {
    bookings
      .filter((b) => {
        if (b.type === 'maintenance' || b.member_id !== currentMember.id || b.trip_end_ack) return false;
        const daysSinceEnd = Math.round((today - parseDate(b.end_date)) / 86400000);
        return daysSinceEnd > 0 && daysSinceEnd <= 3;
      })
      .forEach((b) => {
        notifications.push({
          id: `tripend-${b.id}`,
          icon: '📋',
          title: 'Voyage terminé',
          body: 'Fais le point sur les consommables et ajoute le kilométrage.',
          actionLabel: 'Faire le point',
          onAction: () => { setTripEndBooking(b); setTripEndOpen(true); },
        });
      });
  }
  maintenanceItems.forEach((item) => {
    const s = getMaintenanceStatus(item, currentKm).status;
    if (s !== 'retard' && s !== 'bientot') return;
    notifications.push({
      id: `maint-${item.id}`,
      icon: s === 'retard' ? '🔴' : '🟠',
      title: item.name,
      body: `Entretien : ${STATUS_LABELS[s]}`,
      actionLabel: 'Voir',
      onAction: () => changeTab('entretien'),
    });
  });

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
          <div className="header-actions">
            <span className={`van-status-pill${isVanOut ? ' out' : ''}${currentMaintenanceBooking ? ' maintenance' : ''}`}>
              {currentMaintenanceBooking ? '🔧' : isVanOut ? '🚐' : '✅'}
              <span className="van-status-label">{currentMaintenanceBooking ? 'Chez le garage' : isVanOut ? 'En vadrouille' : 'Van disponible'}</span>
            </span>
            {maintenanceDueCount > 0 && (
              <button
                className="header-maint-pill"
                onClick={() => changeTab('entretien')}
                title="Entretiens à prévoir"
              >
                🔧 {maintenanceDueCount}
              </button>
            )}
            <NotificationBell items={notifications} />
            {currentMember && (
              <div className="current-user" onClick={() => { haptic.tap(); setProfileId(null); }} title="Changer de profil">
                <Avatar member={currentMember} />
                <span>{currentMember.name}</span>
              </div>
            )}
            <HeaderMenu
              items={[
                {
                  label: 'Faire le point sur le van',
                  icon: '📋',
                  onClick: () => { setTripEndBooking(null); setTripEndOpen(true); },
                },
                {
                  label: 'Réglages',
                  icon: '⚙️',
                  onClick: () => setSettingsOpen(true),
                },
                {
                  label: 'Quitter',
                  icon: '🚪',
                  onClick: async () => {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/login';
                  },
                },
              ]}
            />
          </div>
        </div>
      </div>

      <SideDoodles tab={tab} />

      <div className="wrap">
        <CurrentBookingBanner
          bookings={bookings}
          members={members}
          onOpenTripEnd={() => { setTripEndBooking(null); setTripEndOpen(true); }}
        />

        <div className="tabs">
          <button className={`tab${tab === 'accueil' ? ' active' : ''}`} onClick={() => changeTab('accueil')} aria-label="Accueil" title="Accueil">
            <span>🏠</span> <span className="tab-label">Accueil</span>
          </button>
          <button className={`tab${tab === 'calendrier' ? ' active' : ''}`} onClick={() => changeTab('calendrier')} aria-label="Calendrier" title="Calendrier">
            <span>📅</span> <span className="tab-label">Calendrier</span>
          </button>
          <button className={`tab${tab === 'van' ? ' active' : ''}`} onClick={() => changeTab('van')} aria-label="Le van" title="Le van">
            <PineTreeIcon size={15} color={tab === 'van' ? '#C1622D' : '#8A6F4E'} /> <span className="tab-label">Le van</span>
          </button>
          <button className={`tab${tab === 'activite' ? ' active' : ''}`} onClick={() => changeTab('activite')} aria-label="Activité" title="Activité">
            <span>📖</span> <span className="tab-label">Activité</span>
            {hasNewActivity && <span className="tab-dot" />}
          </button>
          <button className={`tab${tab === 'entretien' ? ' active' : ''}`} onClick={() => changeTab('entretien')} aria-label="Entretien" title="Entretien">
            <span>🔧</span> <span className="tab-label">Entretien</span>
            {maintenanceDueCount > 0 && <span className="zone-tab-count">{maintenanceDueCount}</span>}
          </button>
        </div>

        {tab === 'accueil' && (
          <HomeView
            activity={activity}
            bookings={bookings}
            members={members}
            inventory={inventory}
            mileageLogs={mileageLogs}
            maintenanceItems={maintenanceItems}
            currentKm={currentKm}
            importantInfo={importantInfo}
            onImportantInfoChange={setImportantInfo}
            currentMember={currentMember}
            onItemsChange={setInventory}
            onGoToTab={changeTab}
          />
        )}
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

      {currentMember && (
        <IdeaBox
          ideas={ideas}
          onIdeasChange={setIdeas}
          members={members}
          currentMember={currentMember}
        />
      )}

      {!currentMember && <ProfilePicker members={members} onChoose={chooseProfile} />}
      {settingsOpen && (
        <MemberSettings
          members={members}
          onMembersChange={setMembers}
          onBookingsChange={setBookings}
          onCommentsChange={setComments}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {tripEndOpen && (
        <TripEndModal
          items={inventory}
          onItemsChange={setInventory}
          currentMember={currentMember}
          booking={tripEndBooking}
          currentKm={currentKm}
          onMileageLogsChange={setMileageLogs}
          onBookingsChange={setBookings}
          onClose={() => { setTripEndOpen(false); setTripEndBooking(null); }}
        />
      )}
    </div>
  );
}

export default function AppShell(props) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <AppShellInner {...props} />
      </Suspense>
    </ToastProvider>
  );
}
