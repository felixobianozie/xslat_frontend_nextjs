/**
 * app/api/send-payment-verification/route.ts
 *
 * POST endpoint — called when a user completes Step 2 of the admission form.
 *
 * Receives multipart form data including:
 *  - formId, depositorName, email, phone, modeOfPayment, bankPaidTo,
 *    paymentDatetime, transactionReference
 *  - proofFile (uploaded image or PDF — attached to the school email)
 *
 * Sends two emails using Resend:
 *  1. To the applicant (if email provided) — confirmation with their Form ID.
 *  2. To the school — admin notification with all payment details + attachment.
 *
 * Environment variables required (set in .env.local):
 *   RESEND_API_KEY        — your Resend API key
 *   SCHOOL_EMAIL          — school's receiving email address
 *   FROM_EMAIL            — verified sender address on Resend
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { PaymentVerificationEmail } from "@/emails/Paymentverificationemail";

// Initialise Resend with the API key from environment variables
console.log("BREAK 0", process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helper: format a datetime-local string into something readable ──────────
function formatDatetime(raw: string): string {
  if (!raw) return raw;
  try {
    return new Date(raw).toLocaleString("en-NG", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return raw;
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    const formId = formData.get("formId") as string;
    const depositorName = formData.get("depositorName") as string;
    const email = (formData.get("email") as string) || "";
    const phone = formData.get("phone") as string;
    const modeOfPayment = formData.get("modeOfPayment") as string;
    const bankPaidTo = formData.get("bankPaidTo") as string;
    const paymentDatetime = formData.get("paymentDatetime") as string;
    const transactionReference =
      (formData.get("transactionReference") as string) || "";
    const proofFile = formData.get("proofFile") as File | null;

    // Validate required fields
    if (
      !formId ||
      !depositorName ||
      !phone ||
      !modeOfPayment ||
      !bankPaidTo ||
      !paymentDatetime
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Shared email data
    const emailData = {
      formId,
      depositorName,
      email,
      phone,
      modeOfPayment,
      bankPaidTo,
      paymentDatetime: formatDatetime(paymentDatetime),
      transactionReference,
    };
    // Convert proof file to Buffer for attachment (if provided)
    let attachments: {
      filename: string;
      content: Buffer;
      contentType?: string;
    }[] = [];
    if (proofFile && proofFile.size > 0) {
      const arrayBuffer = await proofFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      attachments = [
        {
          filename: `proof-of-payment-${formId}${getExtension(proofFile.name)}`,
          content: buffer,
          contentType: proofFile.type || "application/octet-stream",
        },
      ];
    }
    // ── Email 1: Send to school ───────────────────────────────────────────────
    const schoolHtml = await render(
      PaymentVerificationEmail({
        ...emailData,
        isSchoolCopy: true,
      }) as React.ReactElement,
    );

    console.log("EMAIL SENT");

    await resend.emails.send({
      from:
        process.env.FROM_EMAIL ??
        "Lutheran High School <onboarding@resend.dev>",
      to: process.env.SCHOOL_EMAIL ?? "admin@lutheranhighschool.ng",
      subject: `[Admission] New Payment Verification — Form ID: ${formId}`,
      html: schoolHtml,
      // Attach the proof of payment image/PDF to the school copy
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    // ── Email 2: Send to applicant (only if email is provided) ───────────────
    if (email) {
      const applicantHtml = await render(
        PaymentVerificationEmail({
          ...emailData,
          isSchoolCopy: false,
        }) as React.ReactElement,
      );

      await resend.emails.send({
        from:
          process.env.FROM_EMAIL ??
          "Lutheran High School <onboarding@resend.dev>",
        to: email,
        subject: `Your LHS Admission Form ID — ${formId}`,
        html: applicantHtml,
      });
    }
    // Return success with the generated form ID
    return NextResponse.json({ success: true, formId }, { status: 200 });
  } catch (error) {
    console.error("[send-payment-verification] Error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 },
    );
  }
}

// ── Utility: extract file extension ──────────────────────────────────────────
function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx !== -1 ? filename.substring(idx) : "";
}
