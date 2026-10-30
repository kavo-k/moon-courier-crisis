import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeDelivery,
  getDeliveryPreview,
  launchDelivery,
} from "../api/delivery";
import { endDay, getGameSnapshot, resetGame } from "../api/game";
import { ApiError } from "../api/request";
import { missionDuration } from "../lib/mission";

export function useGame() {
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [roverId, setRoverId] = useState<number | null>(null);
  const failedAutoCompletions = useRef(new Set<number>());
  const operationInFlight = useRef(false);

  const gameQuery = useQuery({
    queryKey: ["game"],
    queryFn: ({ signal }) => getGameSnapshot(signal),
    staleTime: 1000,
    retry: 1,
    refetchInterval: (query) =>
      query.state.data?.activeDeliveries.length ? 1500 : 5000,
  });
  const snapshot = gameQuery.data;
  const selectedOrder = snapshot?.orders.find(
    (order) => order.id === orderId && order.status === "AVAILABLE",
  );
  const selectedRover = snapshot?.rovers.find((rover) => rover.id === roverId);
  const isActive = snapshot?.game.status === "ACTIVE";

  const previewQuery = useQuery({
    // Include the inputs that can change after another tab updates the game.
    queryKey: [
      "delivery-preview",
      selectedOrder?.id,
      selectedRover?.id,
      {
        game: snapshot?.game,
        order: selectedOrder,
        rover: selectedRover,
      },
    ],
    enabled: Boolean(isActive && selectedOrder && selectedRover),
    queryFn: ({ signal }) => {
      if (!selectedOrder || !selectedRover)
        throw new Error("Выбери заказ и ровер.");
      return getDeliveryPreview(
        { orderId: selectedOrder.id, roverId: selectedRover.id },
        signal,
      );
    },
    retry: false,
  });

  const clearSelection = () => {
    setOrderId(null);
    setRoverId(null);
  };
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["game"] }),
      queryClient.invalidateQueries({ queryKey: ["delivery-preview"] }),
    ]);
  };
  const beforeChange = async () => {
    await Promise.all([
      queryClient.cancelQueries({ queryKey: ["game"] }),
      queryClient.cancelQueries({ queryKey: ["delivery-preview"] }),
    ]);
  };

  const launchMutation = useMutation({
    mutationFn: launchDelivery,
    onMutate: beforeChange,
    onSuccess: clearSelection,
    onSettled: refresh,
  });
  const completeMutation = useMutation({
    mutationFn: completeDelivery,
    onMutate: beforeChange,
    onError: (_error, deliveryId) => {
      failedAutoCompletions.current.add(deliveryId);
    },
    onSettled: refresh,
  });
  const endDayMutation = useMutation({
    mutationFn: endDay,
    onMutate: beforeChange,
    onSuccess: () => {
      clearSelection();
      completeMutation.reset();
      launchMutation.reset();
    },
    onSettled: refresh,
  });
  const resetMutation = useMutation({
    mutationFn: resetGame,
    onMutate: beforeChange,
    onSuccess: () => {
      clearSelection();
      failedAutoCompletions.current.clear();
      launchMutation.reset();
      completeMutation.reset();
      endDayMutation.reset();
      queryClient.removeQueries({ queryKey: ["delivery-preview"] });
    },
    onSettled: refresh,
  });
  const busy =
    launchMutation.isPending ||
    completeMutation.isPending ||
    endDayMutation.isPending ||
    resetMutation.isPending;
  const canLaunch = Boolean(
    isActive &&
      selectedOrder &&
      selectedRover &&
      previewQuery.isSuccess &&
      previewQuery.data.possible &&
      !previewQuery.isFetching &&
      !busy,
  );
  const canEndDay = Boolean(
    isActive && snapshot && snapshot.activeDeliveries.length === 0 && !busy,
  );

  // One request at a time, including automatic completion. Refs also cover two
  // clicks before React has committed the disabled state.
  async function runOperation(operation: () => Promise<unknown>) {
    if (operationInFlight.current || busy) return;
    operationInFlight.current = true;
    try {
      await operation();
    } catch {
      /* Error is displayed from the mutation. */
    } finally {
      operationInFlight.current = false;
    }
  }

  const { mutateAsync: finishDelivery } = completeMutation;
  const activeDeliveries = snapshot?.activeDeliveries;
  useEffect(() => {
    const nextDelivery = activeDeliveries?.find(
      (delivery) => !failedAutoCompletions.current.has(delivery.id),
    );
    if (!nextDelivery || busy || !isActive) return;
    const remaining =
      Date.parse(nextDelivery.startedAt) +
      missionDuration(nextDelivery.distance) -
      Date.now();
    const timer = window.setTimeout(
      () => {
        if (operationInFlight.current) return;
        operationInFlight.current = true;
        void finishDelivery(nextDelivery.id)
          .catch(() => undefined)
          .finally(() => {
            operationInFlight.current = false;
          });
      },
      Math.max(0, remaining),
    );
    return () => window.clearTimeout(timer);
  }, [activeDeliveries, busy, isActive, finishDelivery]);

  const mutations = [
    resetMutation,
    endDayMutation,
    completeMutation,
    launchMutation,
  ];
  const errorMutation = mutations.find((mutation) => mutation.isError);
  // A 404/409 after another tab finishes or resets is resolved by the refreshed
  // snapshot; don't keep an obsolete error for a delivery that no longer exists.
  const completionAlreadyResolved =
    errorMutation === completeMutation &&
    completeMutation.error instanceof ApiError &&
    [404, 409].includes(completeMutation.error.status) &&
    !snapshot?.activeDeliveries.some(
      (delivery) => delivery.id === completeMutation.variables,
    );

  return {
    gameQuery,
    snapshot,
    previewQuery,
    selectedOrder,
    selectedRover,
    busy,
    canLaunch,
    canEndDay,
    launchMutation,
    completeMutation,
    endDayMutation,
    resetMutation,
    error: completionAlreadyResolved ? null : errorMutation?.error,
    dismissError: () => {
      for (const mutation of mutations) if (mutation.isError) mutation.reset();
    },
    selectOrder: (id: number) => {
      if (!busy && isActive) {
        setOrderId(id);
        launchMutation.reset();
      }
    },
    selectRover: (id: number) => {
      if (!busy && isActive) {
        setRoverId(id);
        launchMutation.reset();
      }
    },
    launch: () => {
      if (canLaunch && selectedOrder && selectedRover)
        void runOperation(() =>
          launchMutation.mutateAsync({
            orderId: selectedOrder.id,
            roverId: selectedRover.id,
          }),
        );
    },
    complete: (id: number) => {
      if (snapshot?.activeDeliveries.some((delivery) => delivery.id === id))
        void runOperation(() => completeMutation.mutateAsync(id));
    },
    endDay: () => {
      if (canEndDay && snapshot)
        void runOperation(() => endDayMutation.mutateAsync(snapshot.game.day));
    },
    reset: () => runOperation(() => resetMutation.mutateAsync()),
  };
}
