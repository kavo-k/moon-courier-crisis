import { useState } from "react";
import "./App.css";
import { useGame } from "./hooks/useGame";
import { useMissionClock } from "./hooks/useMissionClock";
import { DeliveryPreview } from "./components/DeliveryPreview";
import { MoonMap } from "./components/MoonMap";
import { OrderList } from "./components/OrderList";
import { RoverList } from "./components/RoverList";
import { MissionLog } from "./components/MissionLog";
import { ResetDialog } from "./components/ResetDialog";
import { missionProgress } from "./lib/mission";
import { money, outcomeLabels, signed } from "./lib/labels";

function App() {
  const game = useGame();
  const [resetOpen, setResetOpen] = useState(false);
  const now = useMissionClock(Boolean(game.snapshot?.activeDeliveries.length));
  const snapshot = game.snapshot;

  if (!snapshot) {
    return (
      <main className="state-screen">
        <div className="state-card">
          <span className="eyebrow">MOON COURIER / UPLINK</span>
          {game.gameQuery.isError ? (
            <>
              <h1>Связь с базой потеряна</h1>
              <p>{game.gameQuery.error.message}</p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => void game.gameQuery.refetch()}
              >
                Повторить подключение
              </button>
            </>
          ) : (
            <>
              <span className="loading-orbit" aria-hidden="true" />
              <h1>Подключаемся к базе</h1>
              <p role="status">Загружаем состояние экспедиции…</p>
            </>
          )}
        </div>
      </main>
    );
  }

  const { game: state, rules, stats, activeDeliveries } = snapshot;
  const finished = state.status !== "ACTIVE";
  const selectionDisabled = game.busy || finished;
  const result = game.completeMutation.isSuccess
    ? game.completeMutation.data
    : null;
  const remaining = Math.max(
    0,
    rules.maxDeliveriesPerDay - state.deliveriesToday,
  );
  const dayHint = activeDeliveries.length
    ? "Сначала дождись возвращения связи со всеми миссиями."
    : state.day === rules.totalDays
      ? "Заверши последний день, чтобы подвести итоги экспедиции."
      : `Новый день: заряд +${rules.dailyRecharge}%, возврат на базу и новые заказы.`;
  const progress = Math.min(100, (state.money / rules.targetMoney) * 100);

  return (
    <main className="mission-shell">
      <header className="mission-header">
        <a
          className="mission-brand"
          href="#main-content"
          aria-label="Moon Courier Crisis, к игровому полю"
        >
          <span className="moon-mark" aria-hidden="true" />
          <span>
            <span className="eyebrow">LUNAR LOGISTICS DIVISION</span>
            <h1>
              Moon Courier<span>Crisis.</span>
            </h1>
          </span>
        </a>
        <div className="header-actions">
          <span
            className="connection-status"
            data-offline={game.gameQuery.isError}
          >
            <i />
            {game.gameQuery.isError ? "Нет связи" : "База на связи"}
          </span>
          <button
            className="button button--ghost button--small"
            type="button"
            disabled={game.busy}
            onClick={() => setResetOpen(true)}
          >
            Новая игра
          </button>
        </div>
      </header>

      <section className="metrics" aria-label="Показатели игры">
        <div className="metric">
          <span className="metric-label">День экспедиции</span>
          <p className="metric-value">
            {state.day}
            <span> / {rules.totalDays}</span>
          </p>
          <div className="day-dots" aria-hidden="true">
            {Array.from({ length: rules.totalDays }, (_, index) => (
              <i key={index} data-passed={index < state.day} />
            ))}
          </div>
        </div>
        <div className="metric">
          <span className="metric-label">Баланс базы</span>
          <p className="metric-value metric-value--accent">
            {money(state.money)}
          </p>
          <span className="metric-note">Цель {money(rules.targetMoney)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Очки экспедиции</span>
          <p className="metric-value">{state.score.toLocaleString("ru-RU")}</p>
          <span className="metric-note">
            {stats.successfulDeliveries} успешных доставок
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Рейтинг базы</span>
          <p
            className="metric-value"
            data-danger={state.rating <= rules.minWinningRating}
          >
            {state.rating}
            <span>%</span>
          </p>
          <span className="metric-note">
            Для победы выше {rules.minWinningRating}%
          </span>
        </div>
      </section>

      <section className="objective-strip" aria-label="Цель экспедиции">
        <div>
          <span className="objective-icon" aria-hidden="true">
            ↗
          </span>
          <p>
            Снабди колонию за {rules.totalDays} дней.
            <span>
              {" "}
              Заработай {money(rules.targetMoney)} и сохрани рейтинг выше{" "}
              {rules.minWinningRating}%.
            </span>
          </p>
        </div>
        <progress
          value={progress}
          max={100}
          aria-label="Прогресс денежной цели"
        >
          {Math.round(progress)}%
        </progress>
      </section>

      {game.error && (
        <div className="notice notice--error" role="alert">
          <p>{game.error.message}</p>
          <button
            type="button"
            onClick={game.dismissError}
            aria-label="Закрыть сообщение"
          >
            ×
          </button>
        </div>
      )}
      {game.gameQuery.isError && (
        <div className="notice notice--error" role="alert">
          <p>
            Не удалось обновить состояние базы. Показаны последние полученные
            данные.
          </p>
          <button type="button" onClick={() => void game.gameQuery.refetch()}>
            Повторить
          </button>
        </div>
      )}

      {finished && (
        <section
          className="game-finale panel"
          data-won={state.status === "WON"}
          aria-labelledby="finale-title"
        >
          <span className="eyebrow">ЭКСПЕДИЦИЯ ЗАВЕРШЕНА</span>
          <h2 id="finale-title">
            {state.status === "WON"
              ? "Миссия выполнена."
              : "Миссия не удалась."}
          </h2>
          <p>
            {state.status === "WON"
              ? "Колония обеспечена. Отличная работа, диспетчер."
              : "Колонии не хватило ресурсов или доверия. Попробуй другую стратегию."}
          </p>
          <dl className="finale-stats">
            <div>
              <dt>Баланс</dt>
              <dd>{money(state.money)}</dd>
            </div>
            <div>
              <dt>Рейтинг</dt>
              <dd>{state.rating}%</dd>
            </div>
            <div>
              <dt>Успешно</dt>
              <dd>{stats.successfulDeliveries}</dd>
            </div>
            <div>
              <dt>Потеряно</dt>
              <dd>{stats.failedDeliveries}</dd>
            </div>
            <div>
              <dt>Истекло</dt>
              <dd>{stats.expiredOrders}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="button button--primary"
            disabled={game.busy}
            onClick={() => setResetOpen(true)}
          >
            Новая экспедиция →
          </button>
        </section>
      )}

      <div className="game-layout" id="main-content">
        <OrderList
          orders={snapshot.orders}
          day={state.day}
          selectedId={game.selectedOrder?.id}
          disabled={selectionDisabled}
          finished={finished}
          onSelect={game.selectOrder}
        />
        <MoonMap
          snapshot={snapshot}
          selectedOrder={game.selectedOrder}
          selectedRoverId={game.selectedRover?.id}
          disabled={selectionDisabled}
          onSelectOrder={game.selectOrder}
          now={now}
        />
        <RoverList
          rovers={snapshot.rovers}
          selectedId={game.selectedRover?.id}
          disabled={selectionDisabled}
          onSelect={game.selectRover}
        />
      </div>

      {!finished && (
        <section
          className="panel preview-panel"
          aria-labelledby="preview-title"
        >
          <header className="panel-heading">
            <div>
              <span className="eyebrow">ПЛАНИРОВАНИЕ МАРШРУТА</span>
              <h2 id="preview-title">Подготовка доставки</h2>
            </div>
            <span className="subtle">
              {remaining} из {rules.maxDeliveriesPerDay} запусков осталось
            </span>
          </header>
          <div className="preview-body">
            {!game.selectedOrder || !game.selectedRover ? (
              <div className="preview-placeholder">
                <span aria-hidden="true">⌖</span>
                <div>
                  <h3>Куда отправимся?</h3>
                  <p>Выбери заказ слева или на карте, затем ровер справа.</p>
                </div>
              </div>
            ) : game.previewQuery.isPending ? (
              <p className="subtle" role="status">
                Рассчитываем расстояние, энергию и риск…
              </p>
            ) : game.previewQuery.isError ? (
              <div className="preview-error" role="alert">
                <p>{game.previewQuery.error.message}</p>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  disabled={game.busy}
                  onClick={() => void game.previewQuery.refetch()}
                >
                  Повторить расчёт
                </button>
              </div>
            ) : game.previewQuery.data ? (
              <>
                <DeliveryPreview preview={game.previewQuery.data} />
                <div className="launch-row">
                  <p className="subtle">
                    {game.previewQuery.isFetching
                      ? "Обновляем расчёт…"
                      : "Исход определит база после прибытия ровера."}
                  </p>
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={!game.canLaunch}
                    onClick={game.launch}
                  >
                    {game.launchMutation.isPending
                      ? "Запускаем…"
                      : "Запустить доставку ↗"}
                  </button>
                </div>
              </>
            ) : null}
            {remaining === 0 && (
              <p className="limit-hint">
                Дневной лимит исчерпан. Заверши активные миссии и переходи к
                следующему дню.
              </p>
            )}
          </div>
        </section>
      )}

      {activeDeliveries.length > 0 && (
        <section className="panel active-panel" aria-labelledby="active-title">
          <header className="panel-heading">
            <div>
              <span className="eyebrow">ТРАНСПОРТ НА МАРШРУТЕ</span>
              <h2 id="active-title">Активные доставки</h2>
            </div>
            <span className="subtle">Завершаются автоматически</span>
          </header>
          <div className="active-list">
            {activeDeliveries.map((delivery) => {
              const order = snapshot.orders.find(
                (item) => item.id === delivery.orderId,
              );
              const rover = snapshot.rovers.find(
                (item) => item.id === delivery.roverId,
              );
              const percent = Math.round(missionProgress(delivery, now) * 100);
              return (
                <article key={delivery.id} className="active-mission">
                  <div>
                    <h3>
                      {rover?.name} → {order?.destination}
                    </h3>
                    <p>
                      Миссия #{delivery.id} · {delivery.distance} км ·{" "}
                      {percent < 100 ? "В пути" : "Ожидаем отчёт базы"}
                    </p>
                  </div>
                  <progress
                    value={percent}
                    max={100}
                    aria-label={`Доставка #${delivery.id}: ${percent}%`}
                  >
                    {percent}%
                  </progress>
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    disabled={game.busy || percent < 100}
                    onClick={() => game.complete(delivery.id)}
                  >
                    {game.completeMutation.isPending &&
                    game.completeMutation.variables === delivery.id
                      ? "Получаем отчёт…"
                      : "Повторить завершение"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {result && (
        <section
          className="panel delivery-result"
          data-outcome={result.outcome}
          role="status"
        >
          <div>
            <span className="eyebrow">
              ОТЧЁТ ПО МИССИИ #{result.deliveryId}
            </span>
            <h2>{outcomeLabels[result.outcome]}</h2>
          </div>
          <dl>
            <div>
              <dt>Награда</dt>
              <dd>{money(result.rewardReceived)}</dd>
            </div>
            <div>
              <dt>Очки</dt>
              <dd>+{result.scoreGained}</dd>
            </div>
            <div>
              <dt>Рейтинг</dt>
              <dd>{signed(result.ratingChange)}</dd>
            </div>
            <div>
              <dt>Батарея</dt>
              <dd>−{result.batterySpent}%</dd>
            </div>
          </dl>
        </section>
      )}

      <div className="bottom-layout">
        <MissionLog events={snapshot.recentEvents} />
        <section className="panel day-panel">
          <span className="eyebrow">СМЕНА ДИСПЕТЧЕРА</span>
          <h2>
            {finished
              ? "До следующей экспедиции"
              : `День ${state.day} / ${rules.totalDays}`}
          </h2>
          <p>
            {finished
              ? "Результаты сохранены. Новая игра доступна в любой момент."
              : dayHint}
          </p>
          <div className="day-summary">
            <span>Запусков сегодня</span>
            <strong>
              {state.deliveriesToday} / {rules.maxDeliveriesPerDay}
            </strong>
          </div>
          {!finished && (
            <button
              type="button"
              className="button button--secondary"
              disabled={!game.canEndDay}
              onClick={game.endDay}
            >
              {game.endDayMutation.isPending
                ? "Передаём смену…"
                : state.day === rules.totalDays
                  ? "Подвести итоги →"
                  : "Завершить день →"}
            </button>
          )}
          <details className="rules-details">
            <summary>Правила экспедиции</summary>
            <p>
              Срочные заказы истекают сегодня, обычные — через день, несрочные —
              через два. Скалы и кратеры увеличивают расход энергии и риск.
              Тяжёлый груз требует больше батареи. Ночью роверы возвращаются на
              базу и получают +{rules.dailyRecharge}% заряда. Доставка может
              закончиться бурей, повреждением или потерей груза.
            </p>
          </details>
        </section>
      </div>
      <footer className="mission-footer">
        <span>MOON COURIER CRISIS</span>
        <span>Одна база. Три ровера. Пять дней.</span>
      </footer>
      {resetOpen && (
        <ResetDialog
          busy={game.busy}
          onCancel={() => setResetOpen(false)}
          onConfirm={() => {
            void game.reset().then(() => setResetOpen(false));
          }}
        />
      )}
    </main>
  );
}

export default App;
