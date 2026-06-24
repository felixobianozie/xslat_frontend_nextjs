import { Metadata } from "next";
import Link from "next/link";
import ContactValidationForm from "./components/Contactvalidationform";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Verify Your Account · LHS",
  description:
    "Verify your email or phone number to finish setting up your account.",
};

export default function ContactValidationPage() {
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
                VERIFY YOUR CREDENTIALS TO ENABLE LOGIN
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-white shadow-sm shadow-violet-100/50 border border-gray-100 p-5 sm:p-6">
            <ContactValidationForm />
          </div>
        </div>
      </div>
    </main>
  );
}
