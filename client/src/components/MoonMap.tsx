import type { CSSProperties } from "react";
import type { GameSnapshot, Order } from "../types/game";
import { missionProgress } from "../lib/mission";

type MoonMapProps = {
  snapshot: GameSnapshot;
  selectedOrder?: Order;
  selectedRoverId?: number;
  onSelectOrder: (id: number) => void;
  disabled: boolean;
  now: number;
};

export function RoverIcon() {
  return (
    <svg viewBox="0 0 28 22" fill="none" aria-hidden="true">
      <path
        d="M5 15V9h14l4 6H5ZM10 9V4h8v5M14 4V1m0 0h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="18" r="2.5" fill="currentColor" />
      <circle cx="20" cy="18" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function MoonMap({
  snapshot,
  selectedOrder,
  selectedRoverId,
  onSelectOrder,
  disabled,
  now,
}: MoonMapProps) {
  const { basePosition } = snapshot.rules;
  const selectedRover = snapshot.rovers.find(
    (rover) => rover.id === selectedRoverId,
  );
  // Expired and delivered orders can share a station with new orders. Render
  // one selectable marker per station instead of stacking identical buttons.
  const stations = new Map<string, Order[]>();
  for (const order of snapshot.orders) {
    if (order.status !== "AVAILABLE" && order.status !== "IN_DELIVERY")
      continue;
    const key = `${order.x}:${order.y}:${order.destination}`;
    stations.set(key, [...(stations.get(key) ?? []), order]);
  }

  return (
    <section className="map-panel panel" aria-labelledby="map-title">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">SECTOR 07 / MARE TRANQUILLITATIS</span>
          <h2 id="map-title">Лунный сектор</h2>
        </div>
        <span className="map-live">
          <i /> Телеметрия
        </span>
      </header>
      <div className="moon-map" aria-label="Карта базы, заказов и роверов">
        <svg
          className="map-terrain"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="map-grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M10 0H0V10"
                fill="none"
                stroke="#c6d4dd"
                strokeOpacity=".07"
                strokeWidth=".18"
              />
            </pattern>
            <radialGradient id="moon-ground">
              <stop stopColor="#33454c" />
              <stop offset="1" stopColor="#172830" />
            </radialGradient>
            <radialGradient id="crater-fill">
              <stop stopColor="#0d1921" />
              <stop offset=".75" stopColor="#20343d" />
              <stop offset="1" stopColor="#4d5c5d" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#moon-ground)" />
          <ellipse
            cx="20"
            cy="70"
            rx="24"
            ry="24"
            fill="#91d8cc"
            opacity=".055"
          />
          <path
            d="M38 0H78L79 17 65 41 80 48 67 62 49 43 43 18Z"
            fill="#b3a084"
            opacity=".12"
          />
          <path
            d="m49 8 7 16-7 13 13 12m4-42-4 17 8 14m-26-9 8 7"
            fill="none"
            stroke="#bea98a"
            strokeOpacity=".16"
            strokeWidth=".7"
          />
          <ellipse
            cx="76"
            cy="77"
            rx="20"
            ry="18"
            fill="url(#crater-fill)"
            stroke="#a2a69e"
            strokeOpacity=".15"
            strokeWidth=".45"
          />
          <ellipse
            cx="76"
            cy="77"
            rx="15"
            ry="13"
            fill="none"
            stroke="#819798"
            strokeOpacity=".12"
            strokeWidth=".5"
          />
          <ellipse
            cx="89"
            cy="32"
            rx="11"
            ry="12"
            fill="url(#crater-fill)"
            opacity=".75"
          />
          <circle
            cx="17"
            cy="20"
            r="7"
            fill="url(#crater-fill)"
            opacity=".65"
          />
          <circle cx="33" cy="89" r="4" fill="url(#crater-fill)" opacity=".6" />
          <circle
            cx="9"
            cy="43"
            r="2.8"
            fill="url(#crater-fill)"
            opacity=".65"
          />
          <rect width="100" height="100" fill="url(#map-grid)" />
          <text x="6" y="91" className="zone-label">
            SAFE PLAIN
          </text>
          <text x="48" y="16" className="zone-label">
            ROCKY RIDGE
          </text>
          <text x="64" y="96" className="zone-label">
            CRATER FIELD
          </text>
          {selectedOrder && selectedRover && (
            <line
              className="preview-line"
              x1={selectedRover.x}
              y1={selectedRover.y}
              x2={selectedOrder.x}
              y2={selectedOrder.y}
            />
          )}
          {snapshot.activeDeliveries.map((delivery) => {
            const rover = snapshot.rovers.find(
              (item) => item.id === delivery.roverId,
            );
            const order = snapshot.orders.find(
              (item) => item.id === delivery.orderId,
            );
            return rover && order ? (
              <line
                key={delivery.id}
                className="active-line"
                x1={rover.x}
                y1={rover.y}
                x2={order.x}
                y2={order.y}
              />
            ) : null;
          })}
        </svg>
        <span className="map-coordinate map-coordinate--top">
          N ↑ &nbsp; 0—100 KM
        </span>
        <span className="map-coordinate map-coordinate--bottom">
          LUNAR COURIER / LOCAL GRID
        </span>
        <div
          className="base-marker"
          style={{ left: `${basePosition.x}%`, top: `${basePosition.y}%` }}
        >
          <span className="base-symbol">⌂</span>
          <span>БАЗА</span>
        </div>
        {[...stations.values()].map((orders) => {
          const order =
            orders.find((item) => item.id === selectedOrder?.id) ??
            orders.find((item) => item.status === "AVAILABLE") ??
            orders[0];
          const selected = orders.some((item) => item.id === selectedOrder?.id);
          const availableCount = orders.filter(
            (item) => item.status === "AVAILABLE",
          ).length;
          return (
            <button
              key={`${order.x}:${order.y}:${order.destination}`}
              type="button"
              className="station-marker"
              data-selected={selected}
              data-terrain={order.terrain}
              style={{ left: `${order.x}%`, top: `${order.y}%` }}
              disabled={disabled || availableCount === 0}
              aria-pressed={selected}
              aria-label={`Выбрать ${order.destination}. Доступно заказов: ${availableCount}`}
              onClick={() => onSelectOrder(order.id)}
            >
              <span className="station-dot" />
              <span
                className={`station-label ${order.x > 80 ? "station-label--left" : ""}`}
              >
                {order.destination}
                {availableCount > 1 && <small> ×{availableCount}</small>}
              </span>
            </button>
          );
        })}
        {snapshot.rovers.map((rover, index) => {
          const delivery = snapshot.activeDeliveries.find(
            (item) => item.roverId === rover.id,
          );
          const destination =
            delivery &&
            snapshot.orders.find((item) => item.id === delivery.orderId);
          const progress = delivery ? missionProgress(delivery, now) : 0;
          const x = destination
            ? rover.x + (destination.x - rover.x) * progress
            : rover.x;
          const y = destination
            ? rover.y + (destination.y - rover.y) * progress
            : rover.y;
          return (
            <div
              key={rover.id}
              className="map-rover"
              data-moving={Boolean(delivery)}
              data-selected={rover.id === selectedRoverId}
              style={
                {
                  left: `${x}%`,
                  top: `${y}%`,
                  "--park-offset": `${index * 9 - 9}px`,
                } as CSSProperties
              }
              title={rover.name}
              aria-label={`${rover.name}${delivery ? ", в пути" : ", на стоянке"}`}
            >
              <RoverIcon />
              <span>{rover.name}</span>
            </div>
          );
        })}
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-dot legend-dot--safe" /> Равнина
        </span>
        <span>
          <i className="legend-dot legend-dot--rocky" /> Скалы · ×1,2 энергии
        </span>
        <span>
          <i className="legend-dot legend-dot--crater" /> Кратеры · ×1,35
          энергии
        </span>
      </div>
    </section>
  );
}
