import type { Rover } from "../types/game";
import { roverLabels } from "../lib/labels";
import { RoverIcon } from "./MoonMap";

type Props = {
  rovers: Rover[];
  selectedId?: number;
  disabled: boolean;
  onSelect: (id: number) => void;
};

export function RoverList({ rovers, selectedId, disabled, onSelect }: Props) {
  return (
    <section className="panel rovers-panel" aria-labelledby="rovers-title">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">ТРАНСПОРТ БАЗЫ</span>
          <h2 id="rovers-title">
            Роверы <span className="count">{rovers.length}</span>
          </h2>
        </div>
      </header>
      <div className="rover-list">
        {rovers.map((rover) => (
          <button
            className="rover-card"
            type="button"
            key={rover.id}
            data-selected={selectedId === rover.id}
            aria-pressed={selectedId === rover.id}
            disabled={disabled}
            onClick={() => onSelect(rover.id)}
          >
            <div className="rover-card-heading">
              <span className="rover-emblem">
                <RoverIcon />
              </span>
              <div>
                <h3>{rover.name}</h3>
                <span className="rover-status" data-status={rover.status}>
                  <i />
                  {roverLabels[rover.status]}
                </span>
              </div>
            </div>
            <div className="battery-heading">
              <span>Батарея</span>
              <strong data-low={rover.battery < 25}>{rover.battery}%</strong>
            </div>
            <meter
              className="battery-meter"
              min={0}
              max={100}
              low={25}
              high={60}
              optimum={100}
              value={rover.battery}
              aria-label={`Батарея ${rover.name}`}
            >
              {rover.battery}%
            </meter>
            <div className="rover-capacity">
              <span>Грузоподъёмность</span>
              <strong>{rover.capacity} кг</strong>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
