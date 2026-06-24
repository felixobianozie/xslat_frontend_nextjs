"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Requeststaffprofilepanel.tsx
//
// Slide-out panel for sending a "Request Staff Profile" to a school.
//
// Backend contract:
//   POST staff/requests/list/  body: { user, school }
//   * user  — UUID of the currently logged-in user (from session JWT claims).
//   * school — UUID of the school to request membership in.
//
// School picker:
//   * GET school/list/?name=<query> is used for live search.
//   * The picker stays open per session — a user can request membership in
//     multiple schools, so the parent never disables this card.
//
// The serializer enforces:
//   * One request per (user, school) pair — duplicates are rejected with a
//     400 whose message we surface verbatim in a toast.
//   * The user must not already be staff at the school — also surfaced as a
//     toast on failure.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronLeft, Search, UserCog } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../components/Buttonloader";

interface SchoolOption {
  id: string;
  name: string;
  abbr?: string;
  city?: string;
  country?: string;
}

interface RequestStaffProfilePanelProps {
  show: boolean;
  onClose: () => void;
  /** User id from session JWT — required to identify the requesting user. */
  userId: string;
}

export default function RequestStaffProfilePanel({
  show,
  onClose,
  userId,
}: RequestStaffProfilePanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  // Reset form whenever the panel re-opens — keeps stale selections out.
  useEffect(() => {
    if (show) {
      setSearchQuery("");
      setSelectedSchoolId("");
    }
  }, [show]);

  // Lightweight debounce — wait 300 ms after the user stops typing before
  // hitting the backend so we don't fire a request on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  // ── Fetch schools (filtered by search) ───────────────────────────────────
  const {
    data: schoolsData,
    isLoading: schoolsLoading,
    isError: schoolsError,
  } = useQuery<{ data: SchoolOption[] }>({
    queryKey: ["schools", "search", debouncedQuery],
    queryFn: async () => {
      const url = debouncedQuery.trim()
        ? `school/list/?name=${encodeURIComponent(debouncedQuery.trim())}`
        : `school/list/`;
      const { data, error } = await clientAuthFetch<{ data: SchoolOption[] }>(
        url,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show,
  });

  useEffect(() => {
    if (schoolsError) toast.error("Could not load schools.");
  }, [schoolsError]);

  const schools = useMemo(() => schoolsData?.data ?? [], [schoolsData]);

  // Resolve the currently-selected school for the confirmation summary line.
  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === selectedSchoolId) ?? null,
    [schools, selectedSchoolId],
  );

  // ── Create request mutation ──────────────────────────────────────────────
  const { mutate: submitRequest, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (!selectedSchoolId) throw new Error("Please select a school.");
      const { data, error } = await clientAuthFetch("staff/requests/list/", {
        method: "POST",
        body: { user: userId, school: selectedSchoolId },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Staff profile request sent.");
      // Refresh every variant of the requests-sent query (status filters).
      queryClient.invalidateQueries({
        queryKey: ["my-staff-requests", userId],
      });
      onClose();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to send request.",
      );
    },
  });

  const canSubmit = !!selectedSchoolId && !isSubmitting;

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        <button
          onClick={onClose}
          className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserCog size={14} className="text-violet-600" />
              Request Staff Profile
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick a school to send a staff profile request to. School admins
              will review it.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* School search */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="school-search"
                className="text-xs font-medium text-slate-500"
              >
                Search Schools
              </label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="school-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="School name…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none transition-all bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>

            {/* Results list */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Select a School <span className="text-red-500">*</span>
              </span>
              <div className="border border-slate-200 rounded-xl bg-white max-h-64 overflow-y-auto">
                {schoolsLoading ? (
                  <div className="text-xs text-slate-400 px-3 py-4 text-center">
                    Loading schools…
                  </div>
                ) : schools.length === 0 ? (
                  <div className="text-xs text-slate-400 px-3 py-4 text-center">
                    No schools found.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {schools.map((s) => {
                      const isActive = s.id === selectedSchoolId;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedSchoolId(s.id)}
                            className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              isActive ? "bg-violet-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive ? "bg-violet-100" : "bg-slate-100"
                              }`}
                            >
                              <Building2
                                size={14}
                                className={
                                  isActive
                                    ? "text-violet-600"
                                    : "text-slate-500"
                                }
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-800 truncate">
                                {s.name}
                              </p>
                              {(s.city || s.country) && (
                                <p className="text-[10px] text-slate-400 truncate">
                                  {[s.city, s.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </div>
                            {isActive && (
                              <span className="text-[10px] font-semibold text-violet-700 shrink-0">
                                Selected
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Confirmation summary */}
            {selectedSchool && (
              <div className="text-[11px] text-slate-500 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                You&apos;ll send a staff profile request to{" "}
                <span className="font-semibold text-slate-800">
                  {selectedSchool.name}
                </span>
                .
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => submitRequest()}
              disabled={!canSubmit}
              className="cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
            >
              <span className={isSubmitting ? "invisible" : ""}>
                Send Request
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  isSubmitting ? "" : "invisible"
                }`}
              >
                <ButtonLoader />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
