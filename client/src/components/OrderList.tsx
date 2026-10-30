import type { Order } from "../types/game";
import { money, terrainLabels, urgencyLabels } from "../lib/labels";

type Props = {
  orders: Order[];
  selectedId?: number;
  day: number;
  disabled: boolean;
  finished: boolean;
  onSelect: (id: number) => void;
};

export function OrderList({
  orders,
  selectedId,
  day,
  disabled,
  finished,
  onSelect,
}: Props) {
  const available = orders.filter((order) => order.status === "AVAILABLE");
  return (
    <section className="panel orders-panel" aria-labelledby="orders-title">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">ВХОДЯЩИЕ ЗАДАЧИ</span>
          <h2 id="orders-title">
            Заказы <span className="count">{available.length}</span>
          </h2>
        </div>
      </header>
      <div className="order-list">
        {available.map((order) => (
          <button
            className="order-card"
            type="button"
            key={order.id}
            data-selected={selectedId === order.id}
            aria-pressed={selectedId === order.id}
            disabled={disabled}
            onClick={() => onSelect(order.id)}
          >
            <div className="card-top">
              <span className="order-number">
                #{String(order.id).padStart(3, "0")}
              </span>
              <span className="badge" data-urgency={order.urgency}>
                {urgencyLabels[order.urgency]}
              </span>
            </div>
            <h3>{order.destination}</h3>
            <div className="order-values">
              <span>
                {order.weight} <small>кг</small>
              </span>
              <strong>{money(order.reward)}</strong>
            </div>
            <div className="order-meta">
              <span>{terrainLabels[order.terrain]}</span>
              <span>Базовый риск {order.baseRisk}%</span>
            </div>
            <p className="order-expiry" data-urgent={order.expiresDay <= day}>
              {order.expiresDay <= day
                ? "Истекает сегодня"
                : `До конца дня ${order.expiresDay}`}
            </p>
          </button>
        ))}
        {available.length === 0 && (
          <p className="empty-state">
          {finished ? 'Экспедиция завершена.' : 'Все заказы разобраны.'}
            <br />
          {finished ? 'Новая партия — новые маршруты.' : 'Заверши день, чтобы получить новые.'}
          </p>
        )}
      </div>
    </section>
  );
}
