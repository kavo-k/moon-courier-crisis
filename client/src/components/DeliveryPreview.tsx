import type { DeliveryPreview as DeliveryPreviewData } from "../types/delivery"

type DeliveryPreviewProps = {
    preview: DeliveryPreviewData
}

export function DeliveryPreview({ preview }: DeliveryPreviewProps) {
    return (
        <div className="delivery-preview">
            <h3 className="preview-route">{preview.order.destination} <span aria-label="доставка ровером">→</span> {preview.rover.name}</h3>
            <dl className="preview-details">
                <div><dt>Расстояние</dt><dd>{preview.distance} <span>км</span></dd></div>
                <div><dt>Груз / грузоподъёмность</dt><dd>{preview.order.weight} / {preview.rover.capacity} <span>кг</span></dd></div>
                <div><dt>Требуется батареи</dt><dd>{preview.batteryCost}<span>%</span></dd></div>
                <div><dt>Доступно батареи</dt><dd>{preview.rover.battery}<span>%</span></dd></div>
                <div><dt>Риск</dt><dd>{preview.risk}<span>%</span></dd></div>
                <div><dt>Награда</dt><dd className="reward-value">${preview.order.reward}</dd></div>
            </dl>

            <div className="preview-verdict" data-possible={preview.possible}>
                <p>{preview.possible ? "Доставка возможна" : `Доставка невозможна: ${preview.problems.map((problem) => { <li key={problem.code}>${problem.message}</li>})}`}</p>
            </div>
        </div>

    )
}
