import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import AcceptInviteForm from "./components/Acceptinviteform";

export const metadata: Metadata = {
  title: "Accept Your Invitation · LHS",
  description:
    "Enter your invitation code and choose a password to activate your staff account.",
};

// The invitation email links here as /accept-invite?email=<address>. The email
// is read on the server and handed to the form; the code is typed in by the
// person, so it never appears in a link.
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { email } = await searchParams;
  const invitedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  return (
    <main className="min-h-screen flex flex-col bg-linear-to-br from-violet-50 via-white to-violet-50">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Page header — branding and intro copy */}
          <div className="mb-6 text-center">
            <Link href="/">
              <div className="relative w-12 h-12 bg-white border border-gray-200 rounded-xl shadow-sm mx-auto mb-4 overflow-hidden">
                <Image
                  src="/images/lhs_logo.png"
                  alt="Lutheran High School logo"
                  fill
                  className="object-contain p-1.5"
                />
              </div>
            </Link>
            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-500 font-bold">
                ACCEPT YOUR STAFF INVITATION
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-white shadow-sm shadow-violet-100/50 border border-gray-100 p-5 sm:p-6">
            <AcceptInviteForm email={invitedEmail} />
          </div>
        </div>
      </div>
    </main>
  );
}
