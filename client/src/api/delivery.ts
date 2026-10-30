import type {
  CompleteDeliveryResult,
  DeliveryPreview,
  DeliverySelectionRequest,
  StartedDelivery,
} from "../types/delivery";
import { post, request } from "./request";

export function getDeliveryPreview(
  selection: DeliverySelectionRequest,
  signal?: AbortSignal,
) {
  return request<DeliveryPreview>("/deliveries/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
    signal,
  });
}

export const launchDelivery = (selection: DeliverySelectionRequest) =>
  post<StartedDelivery>("/deliveries", selection);

export const completeDelivery = (deliveryId: number) =>
  post<CompleteDeliveryResult>(`/deliveries/${deliveryId}/complete`);
