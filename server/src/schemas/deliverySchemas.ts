import type { DeliverySelectionRequest } from "../types/delivery.js";

export function isDeliverySelectionRequest(
  value: unknown
): value is DeliverySelectionRequest {

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