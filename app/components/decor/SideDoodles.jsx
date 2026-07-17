'use client';
import { SunIcon, TentIcon, BookIcon, WrenchIcon, GearIcon, OilCanIcon, PineTreeIcon, CompassIcon, TicketPathIcon } from './DoodleIcons';

const SETS = {
  calendrier: {
    left: [
      { Icon: SunIcon, size: 46, rotate: -8 },
      { Icon: TicketPathIcon, size: 34, rotate: 6 },
    ],
    right: [
      { Icon: CompassIcon, size: 40, rotate: 10 },
      { Icon: TentIcon, size: 36, rotate: -6 },
    ],
  },
  van: {
    left: [
      { Icon: PineTreeIcon, size: 44, rotate: -4 },
      { Icon: TentIcon, size: 34, rotate: 8 },
    ],
    right: [
      { Icon: WrenchIcon, size: 38, rotate: 12 },
      { Icon: PineTreeIcon, size: 30, rotate: -10 },
    ],
  },
  activite: {
    left: [
      { Icon: BookIcon, size: 42, rotate: -6 },
      { Icon: CompassIcon, size: 30, rotate: 8 },
    ],
    right: [
      { Icon: BookIcon, size: 34, rotate: 10 },
      { Icon: TicketPathIcon, size: 30, rotate: -8 },
    ],
  },
  entretien: {
    left: [
      { Icon: GearIcon, size: 40, rotate: 10 },
      { Icon: OilCanIcon, size: 32, rotate: -6 },
    ],
    right: [
      { Icon: WrenchIcon, size: 42, rotate: -10 },
      { Icon: GearIcon, size: 28, rotate: 14 },
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
