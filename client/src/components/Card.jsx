export default function Card({ card, selected, disabled, onClick }) {
  return (
    <div
      className={`card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <span className="card-corner">{card.countryFlag}</span>
      <span className="card-flag">{card.countryFlag}</span>
      <span className="card-country">{card.countryName}</span>
      <span className="card-emoji">{card.emoji}</span>
      <span className="card-label">{card.characteristic}</span>
    </div>
  );
}
