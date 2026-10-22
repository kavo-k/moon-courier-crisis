import type { DeliveryPreview, DeliverySelectionRequest, StartedDelivery } from "../types/delivery";

export async function getDeliveryPreview(
    selection: DeliverySelectionRequest,
): Promise<DeliveryPreview> {
    const response = await fetch('/api/deliveries/preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(selection)
    });

    if (response.ok === false) {
        throw new Error(`Не удалось загрузить игру: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data
}

export async function launchDelivery(
    selection: DeliverySelectionRequest,
): Promise<StartedDelivery> {
    const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(selection)
    });

    if (response.ok === false) {
        throw new Error(`Не удалось запустить доставку: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data
}