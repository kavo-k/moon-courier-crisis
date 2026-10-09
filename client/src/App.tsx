import './App.css'
import { useQuery } from '@tanstack/react-query'
import { getGameSnapshot } from './api/game'
import { useState } from 'react'
import { getDeliveryPreview } from './api/delivery'
import { DeliveryPreview } from './components/DeliveryPreview'

function App() {
  const gameQuery = useQuery({
    queryKey: ['game'],
    queryFn: getGameSnapshot,
  })

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [selectedRoverId, setSelectedRoverId] = useState<number | null>(null)
  console.log(selectedOrderId);
  console.log(selectedRoverId);

  const getDelivery = useQuery({
    queryKey: ['delivery-preview', selectedOrderId, selectedRoverId],
    enabled: selectedOrderId !== null && selectedRoverId !== null,
    queryFn: async () => {
      if (selectedOrderId === null || selectedRoverId === null) { throw new Error('Заказ или Ровер не были выбраны'); }
      return await getDeliveryPreview({ orderId: selectedOrderId, roverId: selectedRoverId })
    }
  })

  if (gameQuery.isPending) {
    return (
      <main className="state-screen" aria-busy="true">
        <div className="state-card" role="status">
          <span className="eyebrow">Moon Courier Crisis</span>
          <span className="loading-orbit" aria-hidden="true" />
          <h1>Загрузка игры</h1>
          <p>Получаем состояние лунной базы…</p>
        </div>
      </main>
    )
  }

  if (gameQuery.isError) {
    return (
      <main className="state-screen">
        <div className="state-card" role="alert">
          <span className="eyebrow">Moon Courier Crisis</span>
          <h1>Не удалось загрузить игру</h1>
          <p>{gameQuery.error.message}</p>
          <button className="retry-button" type="button" onClick={() => gameQuery.refetch()}>
            Повторить загрузку
          </button>
        </div>
      </main>
    )
  }


  return (
    <main className="mission-shell">
      <header className="mission-header">
        <div className="mission-brand">
          <span className="moon-mark" aria-hidden="true" />
          <div>
            <span className="eyebrow">Лунная служба доставки</span>
            <h1>Moon Courier Crisis<span className="title-dot">.</span></h1>
          </div>
        </div>
        <span className="game-status" data-status={gameQuery.data.game.status}>{gameQuery.data.game.status}</span>
      </header>
      <section className="metrics" aria-label="Показатели игры">
        <div className="metric">
          <span className="metric-label">День экспедиции</span>
          <p className="metric-value">{gameQuery.data.game.day}<span className="metric-unit"> / 5</span></p>
        </div>
        <div className="metric">
          <span className="metric-label">Баланс базы</span>
          <p className="metric-value metric-value--accent">${gameQuery.data.game.money}</p>
        </div>
        <div className="metric">
          <span className="metric-label">Очки</span>
          <p className="metric-value">{gameQuery.data.game.score}</p>
        </div>
        <div className="metric">
          <span className="metric-label">Рейтинг базы</span>
          <p className="metric-value">{gameQuery.data.game.rating}<span className="metric-unit">%</span></p>
        </div>
      </section>
      <section className="panel preview-panel" aria-labelledby="preview-title">
        <header className="panel-header">
          <div><span className="eyebrow">Подготовка маршрута</span><h2 id="preview-title">Расчёт доставки</h2></div>
        </header>
        <div className="preview-body" aria-live="polite">

        {selectedOrderId === null || selectedRoverId === null ? (
          <p className="preview-hint">Выбери заказ и ровер</p>
        ) : getDelivery.isFetching ? (
          <p className="preview-hint" role="status">Рассчитываем маршрут…</p>
        ) : getDelivery.isError ? (
          <div className="preview-error" role="alert">
            <p>{getDelivery.error.message}</p>

            <button
              className="retry-button"
              type="button"
              onClick={() => getDelivery.refetch()}
            >
              Повторить
            </button>
          </div>
        ) : getDelivery.isSuccess ? (
          <DeliveryPreview preview={getDelivery.data} />
        ) : null}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="orders-title">
          <header className="panel-header">
            <div><span className="eyebrow">Задачи экспедиции</span><h2 id="orders-title">Доступные заказы</h2></div>
            <span className="section-number" aria-hidden="true">01</span>
          </header>
          <div className="order-list">
            {gameQuery.data.orders
              .filter((order) => order.status === 'AVAILABLE')
              .map((order) => (
                <article data-selected={selectedOrderId === order.id} className="order-card" key={order.id}>
                  <div className="card-heading">
                    <button className="select-button" aria-pressed={selectedOrderId === order.id} type='button' onClick={() => { setSelectedOrderId(order.id) }}>Выбрать</button>
                    <h3>{order.destination}</h3>
                    <span className="badge urgency-badge" data-urgency={order.urgency}>{order.urgency}</span>
                  </div>
                  <dl className="card-details">
                    <div><dt>Вес груза</dt><dd>{order.weight} <span>кг</span></dd></div>
                    <div><dt>Награда</dt><dd className="reward-value">${order.reward}</dd></div>
                  </dl>
                </article>
              ))}
            <p className="empty-list">Сейчас нет доступных заказов.</p>
          </div>
        </section>
        <section className="panel" aria-labelledby="rovers-title">
          <header className="panel-header">
            <div><span className="eyebrow">Транспорт базы</span><h2 id="rovers-title">Роверы</h2></div>
            <span className="section-number" aria-hidden="true">02</span>
          </header>
          <div className="rover-list">
            {gameQuery.data.rovers.map((rover) => (
              <article className="rover-card" key={rover.id}>
                <div className="card-heading">
                  <button className="select-button" aria-pressed={selectedOrderId === rover.id} type='button' onClick={() => { setSelectedRoverId(rover.id) }}>Выбрать</button>
                  <h3>{rover.name}</h3>
                  <span className="badge rover-status" data-status={rover.status}>{rover.status}</span>
                </div>
                <div className="battery-heading"><span>Батарея</span><span className="battery-value">{rover.battery}%</span></div>
                <meter className="battery-meter" min={0} max={100} low={25} high={60} optimum={100} value={rover.battery} aria-label={`Батарея ${rover.name}`}>
                  {rover.battery}%
                </meter>
                <div className="rover-capacity"><span>Грузоподъёмность</span><strong>{rover.capacity} кг</strong></div>
              </article>
            ))}
            <p className="empty-list">Роверы отсутствуют.</p>
          </div>
        </section>
        <section className="panel log-panel" aria-labelledby="log-title">
          <header className="panel-header">
            <div><span className="eyebrow">История экспедиции</span><h2 id="log-title">Журнал событий</h2></div>
            <span className="section-number" aria-hidden="true">03</span>
          </header>
          <div className="event-list">
            {gameQuery.data.recentEvents.map((event) => (
              <article className="event-row" key={event.id}>
                <span className="event-marker" aria-hidden="true" />
                <div><h3 className="event-type">{event.type}</h3><p>{event.message}</p></div>
              </article>
            ))}
            <p className="empty-list">Событий пока нет. Впереди первая доставка.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
