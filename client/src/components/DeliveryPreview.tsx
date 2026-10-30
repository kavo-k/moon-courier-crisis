import type { DeliveryPreview as DeliveryPreviewData } from "../types/delivery";
import { money } from "../lib/labels";

export function DeliveryPreview({ preview }: { preview: DeliveryPreviewData }) {
  return (
    <div className="delivery-preview">
      <h3 className="preview-route">
        {preview.order.destination} <span>→</span> {preview.rover.name}
      </h3>
      <dl className="preview-details">
        <div>
          <dt>Расстояние</dt>
          <dd>
            {preview.distance} <small>км</small>
          </dd>
        </div>
        <div>
          <dt>Груз / вместимость</dt>
          <dd>
            {preview.order.weight} / {preview.rover.capacity} <small>кг</small>
          </dd>
        </div>
        <div>
          <dt>Расход батареи</dt>
          <dd>
            {preview.batteryCost}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>Заряд ровера</dt>
          <dd>
            {preview.rover.battery}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>Риск маршрута</dt>
          <dd>
            {preview.risk}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>Награда</dt>
          <dd className="reward-value">{money(preview.order.reward)}</dd>
        </div>
      </dl>
      <div className="preview-verdict" data-possible={preview.possible}>
        <p>
          {preview.possible
            ? "Маршрут готов. Можно отправляться."
            : "Доставка недоступна"}
        </p>
        {!preview.possible && (
          <ul>
            {preview.problems.map((problem) => (
              <li key={problem.code}>{problem.message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
