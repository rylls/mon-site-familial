'use client';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import ProfilePicker from './ProfilePicker';
import Calendar from './Calendar';
import VanInventory from './VanInventory';
import CurrentBookingBanner from './CurrentBookingBanner';
import Mountains from './decor/Mountains';
import { PineTreeIcon } from './decor/DoodleIcons';

const COOKIE_NAME = 'van_profile';

function readCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
function writeCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export default function AppShell({ members, bookings: initialBookings, inventory, comments: initialComments }) {
  const [profileId, setProfileId] = useState(undefined);
  const [tab, setTab] = useState('calendrier');
  const [bookings, setBookings] = useState(initialBookings);
  const [comments, setComments] = useState(initialComments);

  useEffect(() => {
    setProfileId(readCookie(COOKIE_NAME));
  }, []);

  if (profileId === undefined) {
    return null;
  }

  const currentMember = members.find((m) => m.id === profileId) || null;

  function chooseProfile(id) {
    writeCookie(COOKIE_NAME, id);
    setProfileId(id);
  }

  return (
    <div>
      <Mountains />
      <div className="top-header">
        <div className="brand">
          <h1>Wouchi</h1>
          <p>le van de la famille</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentMember && (
            <div className="current-user" onClick={() => setProfileId(null)} title="Changer de profil">
              <Avatar member={currentMember} />
              <span>{currentMember.name}</span>
            </div>
          )}
          <button
            className="btn small"
            onClick={async () => {
              await fetch('/api/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
          >
            Quitter
          </button>
        </div>
      </div>

      <div className="wrap">
        <CurrentBookingBanner bookings={bookings} members={members} />

        <div className="tabs">
          <button className={`tab${tab === 'calendrier' ? ' active' : ''}`} onClick={() => setTab('calendrier')}>
            <span>📅</span> Calendrier
          </button>
          <button className={`tab${tab === 'van' ? ' active' : ''}`} onClick={() => setTab('van')}>
            <PineTreeIcon size={15} color={tab === 'van' ? '#C1622D' : '#8A6F4E'} /> Le van
          </button>
        </div>

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
            initialItems={inventory}
            comments={comments}
            onCommentsChange={setComments}
            members={members}
            currentMember={currentMember}
          />
        )}
      </div>

      {!currentMember && <ProfilePicker members={members} onChoose={chooseProfile} />}
    </div>
  );
}
