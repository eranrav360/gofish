import { COUNTRIES_MAP } from '../countries';

export default function Card({ card, selected, disabled, onClick }) {
  const country = COUNTRIES_MAP[card.country];
  const characteristics = country?.characteristics || [];

  return (
    <div
      className={`card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="card-header">
        <span className="card-flag">{card.countryFlag}</span>
        <span className="card-country">{card.countryName}</span>
      </div>
      <div className="card-main-char">
        <span className="card-emoji">{card.emoji}</span>
        <span className="card-label">{card.characteristic}</span>
      </div>
      <div className="card-all-chars">
        {characteristics.map(c => (
          <div
            key={c.id}
            className={`card-char-dot${c.id === card.id ? ' active' : ''}`}
            title={c.label}
          >
            {c.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
