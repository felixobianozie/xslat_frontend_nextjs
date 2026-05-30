/**
 * emails/AdmissionFormEmail.tsx
 *
 * React Email template sent when an applicant submits their full admission
 * form (Step 3). Sent to both the applicant and the school.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdmissionFormEmailProps {
  formId: string;
  // Personal
  surname: string;
  firstname: string;
  otherNames?: string;
  gender: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  nationality: string;
  religion?: string;
  bloodGroup?: string;
  homeAddress: string;
  // Class
  classApplyingFor: string;
  entryType: string;
  // Previous school
  previousSchoolName?: string;
  lastClassAttended?: string;
  reasonForLeaving?: string;
  // Parent 1
  parent1Surname: string;
  parent1Firstname: string;
  parent1Relationship: string;
  parent1Phone: string;
  parent1Email?: string;
  parent1Occupation?: string;
  // Emergency
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship?: string;
  // Health
  medicalConditions?: string;
  allergies?: string;
  // Meta
  isSchoolCopy?: boolean;
  applicantEmail?: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "600px",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

const headerBand: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
  padding: "32px 32px 28px",
};

const schoolTag: React.CSSProperties = {
  color: "#fbbf24",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  margin: "0 0 6px",
};

const emailTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  fontFamily: "Georgia, serif",
  margin: "0",
  lineHeight: "1.3",
};

const body: React.CSSProperties = {
  padding: "32px",
};

const sectionTitle: React.CSSProperties = {
  color: "#6366f1",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  margin: "24px 0 14px",
  paddingBottom: "8px",
  borderBottom: "1px solid #e2e8f0",
};

const fieldLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  margin: "0 0 3px",
};

const fieldValue: React.CSSProperties = {
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0 0 14px",
};

const formIdBox: React.CSSProperties = {
  backgroundColor: "#eef2ff",
  border: "1px solid #c7d2fe",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "16px 0 24px",
  textAlign: "center",
};

const successBanner: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "0 0 20px",
};

const footerText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  textAlign: "center",
  lineHeight: "1.7",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "8px 0 4px",
};

// ── Helper ────────────────────────────────────────────────────────────────────

/** Renders a label + value pair */
function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Column>
      <Text style={fieldLabel}>{label}</Text>
      <Text style={fieldValue}>{value}</Text>
    </Column>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AdmissionFormEmail = ({
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
  lastClassAttended,
  reasonForLeaving,
  parent1Surname,
  parent1Firstname,
  parent1Relationship,
  parent1Phone,
  parent1Email,
  parent1Occupation,
  emergencyName,
  emergencyPhone,
  emergencyRelationship,
  medicalConditions,
  allergies,
  isSchoolCopy = false,
  applicantEmail,
}: AdmissionFormEmailProps) => {
  const fullName = [surname, firstname, otherNames].filter(Boolean).join(" ");
  const previewText = isSchoolCopy
    ? `New admission form submitted — ${fullName} (Form ID: ${formId})`
    : `Your LHS admission form has been received — ${fullName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={card}>
            {/* ── Header ── */}
            <Section style={headerBand}>
              <Text style={schoolTag}>Lutheran High School, Obot Idim</Text>
              <Heading style={emailTitle}>
                {isSchoolCopy
                  ? "New Admission Form Received"
                  : "Admission Form Submitted Successfully"}
              </Heading>
            </Section>

            {/* ── Body ── */}
            <Section style={body}>
              {/* Applicant greeting */}
              {!isSchoolCopy && (
                <div style={successBanner}>
                  <Text
                    style={{
                      color: "#166534",
                      fontSize: "14px",
                      margin: "0",
                      lineHeight: "1.6",
                    }}
                  >
                    ✅ <strong>Dear {firstname},</strong> your admission form
                    has been successfully received. Our team will review your
                    application and contact you within{" "}
                    <strong>1-48 working hours</strong> to schedule your
                    entrance examination.
                  </Text>
                </div>
              )}

              {/* Form ID */}
              <div style={formIdBox}>
                <Text
                  style={{
                    color: "#6366f1",
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    margin: "0 0 6px",
                  }}
                >
                  Form ID
                </Text>
                <Text
                  style={{
                    color: "#312e81",
                    fontSize: "20px",
                    fontWeight: "700",
                    fontFamily: "monospace",
                    margin: "0",
                    letterSpacing: "0.08em",
                  }}
                >
                  {formId}
                </Text>
              </div>

              <Hr style={divider} />

              {/* ── Personal Details ── */}
              <Text style={sectionTitle}>
                👤 Applicant&apos;s Personal Details
              </Text>

              <Row>
                <Field label="Full Name" value={fullName} />
                <Field label="Gender" value={gender} />
              </Row>
              <Row>
                <Field label="Date of Birth" value={dateOfBirth} />
                <Field label="Nationality" value={nationality} />
              </Row>
              <Row>
                <Field label="State of Origin" value={stateOfOrigin} />
                <Field label="LGA of Origin" value={lgaOfOrigin} />
              </Row>
              <Row>
                <Field label="Religion" value={religion} />
                <Field label="Blood Group" value={bloodGroup} />
              </Row>
              <Row>
                <Field label="Home Address" value={homeAddress} />
              </Row>

              <Hr style={divider} />

              {/* ── Class & Entry ── */}
              <Text style={sectionTitle}>🎓 Class &amp; Entry Details</Text>
              <Row>
                <Field label="Class Applying For" value={classApplyingFor} />
                <Field label="Entry Type" value={entryType} />
              </Row>

              {/* ── Previous School ── */}
              {(previousSchoolName || lastClassAttended) && (
                <>
                  <Hr style={divider} />
                  <Text style={sectionTitle}>🏫 Previous School</Text>
                  <Row>
                    <Field label="School Name" value={previousSchoolName} />
                    <Field
                      label="Last Class Attended"
                      value={lastClassAttended}
                    />
                  </Row>
                  <Row>
                    <Field
                      label="Reason for Leaving"
                      value={reasonForLeaving}
                    />
                  </Row>
                </>
              )}

              <Hr style={divider} />

              {/* ── Parent / Guardian ── */}
              <Text style={sectionTitle}>👨‍👩‍👧 Parent / Guardian</Text>
              <Row>
                <Field
                  label="Name"
                  value={`${parent1Surname} ${parent1Firstname}`}
                />
                <Field label="Relationship" value={parent1Relationship} />
              </Row>
              <Row>
                <Field label="Phone" value={parent1Phone} />
                <Field label="Email" value={parent1Email} />
              </Row>
              <Row>
                <Field label="Occupation" value={parent1Occupation} />
              </Row>

              <Hr style={divider} />

              {/* ── Emergency ── */}
              <Text style={sectionTitle}>🚨 Emergency Contact</Text>
              <Row>
                <Field label="Name" value={emergencyName} />
                <Field label="Phone" value={emergencyPhone} />
              </Row>
              <Row>
                <Field label="Relationship" value={emergencyRelationship} />
              </Row>

              {/* ── Health ── */}
              {(medicalConditions || allergies) && (
                <>
                  <Hr style={divider} />
                  <Text style={sectionTitle}>🏥 Health Information</Text>
                  <Row>
                    <Field
                      label="Medical Conditions"
                      value={medicalConditions}
                    />
                    <Field label="Allergies" value={allergies} />
                  </Row>
                </>
              )}

              {/* School copy — admin note */}
              {isSchoolCopy && (
                <>
                  <Hr style={{ ...divider, margin: "24px 0 8px" }} />
                  <div
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "12px",
                      padding: "14px 18px",
                    }}
                  >
                    <Text
                      style={{
                        color: "#78350f",
                        fontSize: "13px",
                        margin: "0",
                        lineHeight: "1.6",
                      }}
                    >
                      <strong>Admin:</strong> Please review this application and
                      proceed to schedule an entrance examination for{" "}
                      <strong>{fullName}</strong>.
                      {applicantEmail && (
                        <>
                          {" "}
                          Contact: <strong>{applicantEmail}</strong> ·{" "}
                          {parent1Phone}
                        </>
                      )}
                    </Text>
                  </div>
                </>
              )}
            </Section>

            {/* ── Footer ── */}
            <Section
              style={{
                backgroundColor: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                padding: "20px 32px",
              }}
            >
              <Text style={footerText}>
                Lutheran High School, Obot Idim · Ibesikpo Asutan LGA · Akwa
                Ibom State, Nigeria
                <br />
                📞 +234-7040251300 · ✉ admin@lutheranhighschool.ng
                <br />
                <em>
                  This is an automated email. Please do not reply directly.
                </em>
              </Text>
            </Section>
          </div>
        </Container>
      </Body>
    </Html>
  );
};

export default AdmissionFormEmail;
