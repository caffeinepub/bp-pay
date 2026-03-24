import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DashboardStats, UPIEntry } from "../backend";
import { useActor } from "./useActor";

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalCurrentBalance: 0,
          transferIn: 0,
          transferOut: 0,
          lockedDeposit: 0,
          todayCommission: 0,
        };
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpiEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<UPIEntry[]>({
    queryKey: ["upiEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUpiEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUpiEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (upiId: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addUpiEntry(upiId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upiEntries"] });
    },
  });
}

export function useDeleteUpiEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (upiId: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteUpiEntry(upiId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upiEntries"] });
    },
  });
}

export function useAddDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      utrNumber,
    }: { amount: number; utrNumber: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addDeposit(amount, utrNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateDashboardStats() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stats: DashboardStats) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateDashboardStats(stats);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
