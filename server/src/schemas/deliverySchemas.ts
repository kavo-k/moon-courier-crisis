import type { DeliveryPreviewRequest } from "../types/delivery.js";

export function isDeliveryPreviewRequest(
  value: unknown
): value is DeliveryPreviewRequest {

  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as Record<string, unknown>;

  if (
    typeof body.orderId !== "number" ||
    !Number.isInteger(body.orderId) ||
    body.orderId <= 0
  ) {
    return false;
  }

  if (
    typeof body.roverId !== "number" ||
    !Number.isInteger(body.roverId) ||
    body.roverId <= 0
  ) {
    return false;
  }

  return true;
}