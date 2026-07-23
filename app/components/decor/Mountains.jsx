import Image from 'next/image';
import { CloudIcon, BirdIcon, TentIcon, MiniVanIcon, CampfireIcon } from './DoodleIcons';

const TILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 130">
  <path d="M0,100 L50,40 L100,75 L160,20 L220,80 L280,35 L340,85 L400,100 L400,130 L0,130 Z" fill="#5E84A6" fill-opacity="0.32"/>
  <path d="M0,115 L40,85 L90,110 L150,70 L210,112 L260,80 L320,113 L370,88 L400,115 L400,130 L0,130 Z" fill="#6E8F57" fill-opacity="0.4"/>
  <g fill="#3B2B1D" fill-opacity="0.55">
    <path d="M40,85 L33,97 L47,97 Z"/><path d="M40,91 L31,103 L49,103 Z"/><rect x="38.5" y="103" width="3" height="5"/>
    <path d="M150,70 L143,82 L157,82 Z"/><path d="M150,76 L141,88 L159,88 Z"/><rect x="148.5" y="88" width="3" height="5"/>
    <path d="M260,80 L253,92 L267,92 Z"/><path d="M260,86 L251,98 L269,98 Z"/><rect x="258.5" y="98" width="3" height="5"/>
    <path d="M370,88 L363,100 L377,100 Z"/><path d="M370,94 L361,106 L379,106 Z"/><rect x="368.5" y="106" width="3" height="5"/>
  </g>
</svg>`;

const TILE_URL = `url("data:image/svg+xml,${encodeURIComponent(TILE)}")`;

export default function Mountains({ image }) {
  if (image) {
    return (
      <div className="mountains-band mountains-band-custom" aria-hidden="true">
        <Image src={image} alt="" fill className="mountains-band-img" priority />
      </div>
    );
  }

  return (
    <div className="mountains-band" aria-hidden="true" style={{ backgroundImage: TILE_URL }}>
      <div className="mountains-sun" />

      <div className="mountains-cloud cloud-1"><CloudIcon size={46} /></div>
      <div className="mountains-cloud cloud-2"><CloudIcon size={34} /></div>
      <div className="mountains-cloud cloud-3"><CloudIcon size={30} /></div>

      <div className="mountains-birds birds-1">
        <BirdIcon size={16} /><BirdIcon size={12} /><BirdIcon size={14} />
      </div>
      <div className="mountains-birds birds-2">
        <BirdIcon size={13} /><BirdIcon size={10} />
      </div>

      <div className="mountains-tent"><TentIcon size={26} /></div>
      <div className="mountains-campfire"><CampfireIcon size={22} /></div>

      <div className="mountains-road">
        <div className="mountains-van"><MiniVanIcon size={26} color="#FBF2DE" /></div>
      </div>
    </div>
  );
}
