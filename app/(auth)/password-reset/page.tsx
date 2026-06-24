import { Metadata } from "next";
import Link from "next/link";
import PasswordResetForm from "./components/Passwordresetform";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Reset Password · LHS",
  description: "Reset the password for your LHS account.",
};

export default function PasswordResetPage() {
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
            <h1 className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll send a 6-digit code to your registered email.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-white shadow-sm shadow-violet-100/50 border border-gray-100 p-5 sm:p-6">
            <PasswordResetForm />
          </div>
        </div>
      </div>
    </main>
  );
}
