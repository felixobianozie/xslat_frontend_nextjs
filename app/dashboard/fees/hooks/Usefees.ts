"use client";

// ─────────────────────────────────────────
// app/dashboard/fees/hooks/Usefees.ts
//
// The one place the fees pages read and change data. The functions passed to
// useQuery and useMutation come from the sample API in mock/feesapi.ts. When
// a fees API exists, only those functions change; the pages stay as they are.
// ─────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchArmFees,
  fetchFeesOverview,
  markStudentsPaid,
  recordPayment,
  type PaymentInput,
} from "../mock/feesapi";

const FEES_KEY = ["fees"] as const;

/** Every class with its totals, for the overview. */
export function useFeesOverview() {
  return useQuery({
    queryKey: [...FEES_KEY, "overview"],
    queryFn: fetchFeesOverview,
  });
}

/** One class with all of its students' fees. */
export function useArmFees(armId: string) {
  return useQuery({
    queryKey: [...FEES_KEY, "arm", armId],
    queryFn: () => fetchArmFees(armId),
    retry: false,
  });
}

/** Records one payment. Every fees page refreshes afterwards. */
export function useRecordPayment(armId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      input,
    }: {
      studentId: string;
      input: PaymentInput;
    }) => recordPayment(armId, studentId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FEES_KEY }),
  });
}

/** Clears everything the given students owe. Every fees page refreshes afterwards. */
export function useMarkPaid(armId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentIds: string[]) => markStudentsPaid(armId, studentIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FEES_KEY }),
  });
}
