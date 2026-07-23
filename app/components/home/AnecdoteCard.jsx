import Avatar from '../Avatar';
import { formatRange } from '../../lib/dates';

export default function AnecdoteCard({ pastTrip, member }) {
  if (!pastTrip || !pastTrip.note) return null;
  return (
    <div className="home-card anecdote-card">
      <div className="home-card-title">Dernier trajet</div>
      <div className="anecdote-body">
        <Avatar member={member} size="sm" />
        <div>
          <div className="anecdote-quote">« {pastTrip.note} »</div>
          <div className="anecdote-meta">{member?.name} · {formatRange(pastTrip.start_date, pastTrip.end_date)}</div>
        </div>
      </div>
    </div>
  );
}
