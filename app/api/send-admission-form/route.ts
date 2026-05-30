/**
 * app/api/send-admission-form/route.ts
 *
 * POST endpoint — called when a user submits the full admission form (Step 3).
 *
 * Receives JSON body with all admission form fields.
 *
 * Sends two emails using Resend:
 *  1. To the applicant — confirmation copy of their submitted form.
 *  2. To the school — full form data for admin processing.
 *
 * Environment variables required (set in .env.local):
 *   RESEND_API_KEY    — your Resend API key
 *   SCHOOL_EMAIL      — school's receiving email address
 *   FROM_EMAIL        — verified sender address on Resend
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { AdmissionFormEmail } from "@/emails/Admissionformemail";

// Initialise Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const body = await request.json();

    const {
      formId,
      // Personal
      surname,
      firstname,
      otherNames,
      gender,
      dateOfBirth,
      stateOfOrigin,
      lgaOfOrigin,
      nationality,
      religion,
      bloodGroup,
      homeAddress,
      // Class
      classApplyingFor,
      entryType,
      // Previous school
      previousSchoolName,
      previousSchoolAddress,
      lastClassAttended,
      reasonForLeaving,
      // Parent 1
      parent1Surname,
      parent1Firstname,
      parent1Relationship,
      parent1Phone,
      parent1Email,
      parent1Occupation,
      parent1Employer,
      parent1Address,
      // Parent 2
      parent2Surname,
      parent2Firstname,
      parent2Relationship,
      parent2Phone,
      parent2Email,
      // Emergency
      emergencyName,
      emergencyPhone,
      emergencyRelationship,
      // Health
      medicalConditions,
      allergies,
      // Meta
      applicantEmail,
    } = body;

    // Validate required fields
    if (
      !formId ||
      !surname ||
      !firstname ||
      !gender ||
      !classApplyingFor ||
      !parent1Phone
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Shared email data object passed to both templates
    const emailData = {
      formId,
      surname,
      firstname,
      otherNames,
      gender,
      dateOfBirth,
      stateOfOrigin,
      lgaOfOrigin,
      nationality,
      religion,
      bloodGroup,
      homeAddress,
      classApplyingFor,
      entryType,
      previousSchoolName,
      previousSchoolAddress,
      lastClassAttended,
      reasonForLeaving,
      parent1Surname,
      parent1Firstname,
      parent1Relationship,
      parent1Phone,
      parent1Email,
      parent1Occupation,
      parent1Employer,
      parent1Address,
      parent2Surname,
      parent2Firstname,
      parent2Relationship,
      parent2Phone,
      parent2Email,
      emergencyName,
      emergencyPhone,
      emergencyRelationship,
      medicalConditions,
      allergies,
      applicantEmail,
    };

    // ── Email 1: School copy ──────────────────────────────────────────────────
    const schoolHtml = await render(
      AdmissionFormEmail({
        ...emailData,
        isSchoolCopy: true,
      }) as React.ReactElement,
    );

    await resend.emails.send({
      from:
        process.env.FROM_EMAIL ??
        "Lutheran High School <onboarding@resend.dev>",
      to: process.env.SCHOOL_EMAIL ?? "admin@lutheranhighschool.ng",
      subject: `[Admission Form] ${surname} ${firstname} — Form ID: ${formId} — Class: ${classApplyingFor}`,
      html: schoolHtml,
    });

    // ── Email 2: Applicant copy (if email provided) ───────────────────────────
    const recipientEmail = applicantEmail || parent1Email || null;

    if (recipientEmail) {
      const applicantHtml = await render(
        AdmissionFormEmail({
          ...emailData,
          isSchoolCopy: false,
        }) as React.ReactElement,
      );

      await resend.emails.send({
        from:
          process.env.FROM_EMAIL ??
          "Lutheran High School <onboarding@resend.dev>",
        to: recipientEmail,
        subject: `Admission Form Received — ${firstname} ${surname} (Form ID: ${formId})`,
        html: applicantHtml,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[send-admission-form] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit admission form. Please try again." },
      { status: 500 },
    );
  }
}
