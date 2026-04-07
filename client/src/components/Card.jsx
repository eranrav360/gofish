import { COUNTRIES_MAP } from '../countries';

export default function Card({ card, selected, disabled, onClick }) {
  const country = COUNTRIES_MAP[card.country];
  const needed = (country?.characteristics || []).filter(c => c.id !== card.id);

  return (
    <div
      className={`card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      {/* Top: the 3 items still needed to complete the set */}
      <div className="card-needed">
        {needed.map(c => (
          <div key={c.id} className="card-needed-item" title={c.label}>
            <span className="card-needed-emoji">{c.emoji}</span>
            <span className="card-needed-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Middle: this card's item — large */}
      <div className="card-main-char">
        <span className="card-emoji">{card.emoji}</span>
        <span className="card-label">{card.characteristic}</span>
      </div>

      {/* Bottom: category name */}
      <div className="card-footer">
        <span className="card-flag">{card.countryFlag}</span>
        <span className="card-country">{card.countryName}</span>
      </div>
    </div>
  );
}
