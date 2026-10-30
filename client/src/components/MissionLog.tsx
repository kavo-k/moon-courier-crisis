import type { GameEvent } from "../types/game";

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export function MissionLog({ events }: { events: GameEvent[] }) {
  return (
    <section className="panel log-panel" aria-labelledby="log-title">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">СВЯЗЬ С ПОВЕРХНОСТЬЮ</span>
          <h2 id="log-title">Журнал миссии</h2>
        </div>
        <span className="subtle">Последние {events.length} событий</span>
      </header>
      <div className="event-list">
        {events.length ? (
          events.map((event) => (
            <article
              className="event-row"
              key={event.id}
              data-type={event.type}
            >
              <time dateTime={event.createdAt}>
                {formatTime(event.createdAt)}
              </time>
              <span className="event-dot" />
              <p>{event.message}</p>
            </article>
          ))
        ) : (
          <p className="empty-state">
            Канал связи открыт. Впереди первая доставка.
          </p>
        )}
      </div>
    </section>
  );
}
