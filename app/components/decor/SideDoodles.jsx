'use client';
import { SunIcon, TentIcon, BookIcon, WrenchIcon, GearIcon, OilCanIcon, PineTreeIcon, CompassIcon, TicketPathIcon } from './DoodleIcons';

const SETS = {
  calendrier: {
    left: [
      { Icon: SunIcon, size: 92, rotate: -8 },
      { Icon: TicketPathIcon, size: 68, rotate: 6 },
    ],
    right: [
      { Icon: CompassIcon, size: 80, rotate: 10 },
      { Icon: TentIcon, size: 72, rotate: -6 },
    ],
  },
  van: {
    left: [
      { Icon: PineTreeIcon, size: 88, rotate: -4 },
      { Icon: TentIcon, size: 68, rotate: 8 },
    ],
    right: [
      { Icon: WrenchIcon, size: 76, rotate: 12 },
      { Icon: PineTreeIcon, size: 60, rotate: -10 },
    ],
  },
  activite: {
    left: [
      { Icon: BookIcon, size: 84, rotate: -6 },
      { Icon: CompassIcon, size: 60, rotate: 8 },
    ],
    right: [
      { Icon: BookIcon, size: 68, rotate: 10 },
      { Icon: TicketPathIcon, size: 60, rotate: -8 },
    ],
  },
  entretien: {
    left: [
      { Icon: GearIcon, size: 80, rotate: 10 },
      { Icon: OilCanIcon, size: 64, rotate: -6 },
    ],
    right: [
      { Icon: WrenchIcon, size: 84, rotate: -10 },
      { Icon: GearIcon, size: 56, rotate: 14 },
    ],
  },
};

export default function SideDoodles({ tab }) {
  const set = SETS[tab] || SETS.calendrier;
  return (
    <div className="side-doodles" aria-hidden="true">
      <div className="side-doodles-col left">
        {set.left.map(({ Icon, size, rotate }, i) => (
          <div key={i} className="side-doodle-item" style={{ transform: `rotate(${rotate}deg)` }}>
            <Icon size={size} />
          </div>
        ))}
      </div>
      <div className="side-doodles-col right">
        {set.right.map(({ Icon, size, rotate }, i) => (
          <div key={i} className="side-doodle-item" style={{ transform: `rotate(${rotate}deg)` }}>
            <Icon size={size} />
          </div>
        ))}
      </div>
    </div>
  );
}
