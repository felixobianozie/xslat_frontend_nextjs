"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Profilerequestssent.tsx
//
// Displays profile requests the CURRENT user has sent (the inverse of
// Profilerequests.tsx, which is the school admin's inbox).
//
// Tabs:
//   * Staff Requests    — fully functional, fetched from staff/requests/list/?user=<me>
//   * Guardian Requests — no backend yet → tab shows the "feature in the works"
//                         toast and renders a friendly placeholder.
//
// Per-tab filters (chips): All | Pending | Approved | Declined | Blacklisted.
// The filter is appended to the query key so React Query caches each variant
// separately and doesn't refetch when the user toggles back.
//
// Row actions (via the action menu component):
//   * Resend Request — only valid when status === "declined"; performs
//                      PUT staff/requests/detail/ { request_id, status: "pending" }.
//   * Delete Request — no DELETE endpoint exists on the backend; the action
//                      just shows the "feature in the works" toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import EmptyState from "./Emptystate";
import TableLoader from "./Tableloader";
import ProfileRequestsSentActionMenu from "./Profilerequestssentactionmenu";

// ── Constants ────────────────────────────────────────────────────────────────

const FEATURE_IN_WORKS = "This feature is currently in the works.";

// ── Types ────────────────────────────────────────────────────────────────────

type RequestType = "staff" | "guardian";
type RequestStatus = "pending" | "approved" | "declined" | "blacklisted";
type StatusFilter = "all" | RequestStatus;

// Matches the response shape of GET staff/requests/list/ given the field
// allow-list set in StaffProfReqListView.get().
interface StaffRequest {
  id: string;
  status: RequestStatus;
  refresh_count: number;
  created_on: string;
  school: { id: string; name: string };
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// Tab definitions. Same shape as Stafftabarea's TABS — only the key changes
// from a numeric `index` to a string `value` so the comparison stays in
// step with the activeTab state's union type.
const TABS: { label: string; value: RequestType }[] = [
  { label: "Staff", value: "staff" },
  { label: "Guardian", value: "guardian" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfileRequestsSent() {
  const { clientAuthFetch } = useClientAuthFetch();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const userId = session?.accessClaims?.user_id ?? "";

  const [activeTab, setActiveTab] = useState<RequestType>("staff");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Mobile tab-picker state. Mirrors the Stafftabarea pattern so the visual
  // language and outside-click behaviour stay consistent across the app.
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close the mobile dropdown when the user clicks anywhere outside it.
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    }
    if (mobileDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [mobileDropdownOpen]);

  // The label rendered in the mobile picker button.
  const activeLabel = TABS.find((t) => t.value === activeTab)?.label ?? "";

  // ── Fetch the user's staff requests ──────────────────────────────────────
  // Gated on userId (no point requesting until we know who the user is) AND
  // on the active tab being "staff" — the guardian tab has no backend.
  const {
    data: requestsEnvelope,
    isLoading,
    isError,
    error,
  } = useQuery<ApiEnvelope<StaffRequest[]>>({
    queryKey: ["my-staff-requests", userId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("user", userId);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<StaffRequest[]>
      >(`staff/requests/list/?${params.toString()}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!userId && activeTab === "staff",
  });

  useEffect(() => {
    if (isError) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load your requests.",
      );
    }
  }, [isError, error]);

  const requests = useMemo(
    () => requestsEnvelope?.data ?? [],
    [requestsEnvelope],
  );

  // ── Resend mutation (declined → pending) ─────────────────────────────────
  const { mutate: resend } = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await clientAuthFetch("staff/requests/detail/", {
        method: "PUT",
        body: { request_id: requestId, status: "pending" },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Request resent.");
      // Refresh every status-filter variant since the row's status changes.
      queryClient.invalidateQueries({
        queryKey: ["my-staff-requests", userId],
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend request.",
      );
    },
  });

  // Delete has no backend — shared handler for the menu and any other entry.
  const handleDelete = () => toast.info(FEATURE_IN_WORKS);

  // Tab switcher — Guardian tab is a stub since there's no backend.
  const switchTab = (next: RequestType) => {
    setActiveTab(next);
    setStatusFilter("all"); // Reset the filter when switching tabs.
    if (next === "guardian") toast.info(FEATURE_IN_WORKS);
  };

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Your profile requests
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Track the requests you&apos;ve sent to schools.
        </p>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────
          Visual treatment is the SAME as Stafftabarea.tsx:
            * Desktop: inline buttons with a 3px red bottom border on the
              active tab and a soft hover state on the rest.
            * Mobile:  a violet pill button that opens a dropdown of the
              other tabs (closes on outside click).
          The TABS array uses our string-keyed RequestType rather than a
          numeric index — the only structural change vs. the staff page. */}
      <div className="relative border-b border-indigo-400 h-10 mb-6">
        {/* Desktop: inline tab buttons */}
        <div className="hidden md:flex absolute -bottom-0.5 left-0">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => switchTab(tab.value)}
              className={`p-2 text-sm font-medium border-b-[3px] transition-all duration-200 cursor-pointer
                ${
                  activeTab === tab.value
                    ? "border-b-red-700 text-black"
                    : "border-b-transparent text-slate-500 hover:text-black hover:border-b-red-700 hover:scale-105"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile: dropdown picker with outside-click dismissal */}
        <div
          ref={mobileDropdownRef}
          className="md:hidden absolute right-0 bottom-1"
        >
          <button
            onClick={() => setMobileDropdownOpen((prev) => !prev)}
            aria-expanded={mobileDropdownOpen}
            aria-haspopup="listbox"
            className="cursor-pointer flex items-center gap-2 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
          >
            <span>{activeLabel}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${mobileDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {mobileDropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-9 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-44"
            >
              {TABS.filter((t) => t.value !== activeTab).map((tab) => (
                <button
                  key={tab.value}
                  role="option"
                  onClick={() => {
                    switchTab(tab.value);
                    setMobileDropdownOpen(false);
                  }}
                  className="cursor-pointer w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile: active tab name underlined on the left */}
        <div className="md:hidden absolute -bottom-0.5 left-0">
          <span className="block text-sm font-medium text-slate-700 border-b-[3px] border-b-red-700 pb-2 px-1">
            {activeLabel}
          </span>
        </div>
      </div>

      {/* ── Filter chips ──────────────────────────────────────────────── */}
      {/* The filter row is hidden on the guardian tab since there's nothing
          to filter there yet. */}
      {activeTab === "staff" && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(
            [
              "all",
              "pending",
              "approved",
              "declined",
              "blacklisted",
            ] as StatusFilter[]
          ).map((value) => (
            <FilterChip
              key={value}
              label={value === "all" ? "All" : capitalize(value)}
              active={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            />
          ))}
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────── */}
      {activeTab === "guardian" ? (
        <EmptyState
          variant="requests"
          title="Guardian requests coming soon"
          description="This feature is currently in the works."
        />
      ) : isLoading ? (
        <TableLoader rows={4} className="my-6" />
      ) : requests.length === 0 ? (
        <EmptyState
          variant="requests"
          title="No requests yet"
          description="Requests you send will appear here."
        />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold">School</th>
                  <th className="px-5 py-3 font-semibold">Sent</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Resent</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {requests.map((req, index) => (
                  <tr
                    key={req.id}
                    className={`h-14 hover:bg-violet-50/40 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-indigo-50/50"
                    }`}
                  >
                    <td className="px-5">
                      <div className="flex items-center gap-2">
                        <Building2
                          size={14}
                          className="text-slate-400 shrink-0"
                        />
                        <span className="font-medium text-slate-800">
                          {req.school.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 text-slate-500">
                      {req.created_on.slice(0, 10)}
                    </td>
                    <td className="px-5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 text-slate-500">
                      {req.refresh_count > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold">
                          {req.refresh_count}×
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5">
                      <ProfileRequestsSentActionMenu
                        requestId={req.id}
                        status={req.status}
                        onResend={() => resend(req.id)}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="border border-indigo-100 rounded-2xl bg-white overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {req.school.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Sent {req.created_on.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  <ProfileRequestsSentActionMenu
                    requestId={req.id}
                    status={req.status}
                    onResend={() => resend(req.id)}
                    onDelete={handleDelete}
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-50">
                  <StatusBadge status={req.status} />
                  {req.refresh_count > 0 && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold">
                      Resent {req.refresh_count}×
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer px-3 py-1 text-[11px] font-medium rounded-full transition-colors border ${
        active
          ? "bg-violet-600 border-violet-600 text-white"
          : "bg-white border-slate-200 text-slate-500 hover:border-violet-200 hover:text-violet-700"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    declined: "bg-red-50 text-red-600",
    blacklisted: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
