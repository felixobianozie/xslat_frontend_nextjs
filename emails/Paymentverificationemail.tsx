/**
 * emails/PaymentVerificationEmail.tsx
 *
 * React Email template sent when a user completes Step 2 (payment verification).
 * Sent to both the applicant (if email provided) and the school.
 *
 * Props differ slightly for the school vs applicant versions — a single
 * template handles both via the `recipientType` prop.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PaymentVerificationEmailProps {
  /** The unique form ID generated for this application */
  formId: string;
  /** Full depositor name */
  depositorName: string;
  /** Applicant's email address (may be empty) */
  email?: string;
  /** Applicant's phone number */
  phone: string;
  /** Payment mode label */
  modeOfPayment: string;
  /** Bank paid to */
  bankPaidTo: string;
  /** Date and time of payment */
  paymentDatetime: string;
  /** Transaction reference if provided */
  transactionReference?: string;
  /** Whether this copy is for the school (shows extra admin instructions) */
  isSchoolCopy?: boolean;
}

// ── Styles ────────────────────────────────────────────────────────────────────
// React Email uses inline styles — keep them readable as named constants.

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

const schoolName: React.CSSProperties = {
  color: "#fbbf24",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  margin: "0 0 6px",
};

const emailTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "700",
  fontFamily: "Georgia, serif",
  margin: "0",
  lineHeight: "1.3",
};

const body: React.CSSProperties = {
  padding: "32px",
};

const label: React.CSSProperties = {
  color: "#6366f1",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  margin: "0 0 4px",
};

const value: React.CSSProperties = {
  color: "#1e1b4b",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 18px",
};

const formIdBox: React.CSSProperties = {
  backgroundColor: "#eef2ff",
  border: "1px solid #c7d2fe",
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px 0",
  textAlign: "center",
};

const formIdLabel: React.CSSProperties = {
  color: "#6366f1",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const formIdValue: React.CSSProperties = {
  color: "#312e81",
  fontSize: "22px",
  fontWeight: "700",
  fontFamily: "monospace",
  margin: "0",
  letterSpacing: "0.08em",
};

const noticeBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "20px 0",
};

const noticeParagraph: React.CSSProperties = {
  color: "#92400e",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footerText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  textAlign: "center",
  lineHeight: "1.6",
  margin: "0",
};

const schoolCopyBadge: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  padding: "8px 14px",
  display: "inline-block",
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  margin: "0 0 20px",
};

// ── Component ─────────────────────────────────────────────────────────────────

export const PaymentVerificationEmail = ({
  formId,
  depositorName,
  email,
  phone,
  modeOfPayment,
  bankPaidTo,
  paymentDatetime,
  transactionReference,
  isSchoolCopy = false,
}: PaymentVerificationEmailProps) => {
  const previewText = isSchoolCopy
    ? `New admission payment verification — Form ID: ${formId}`
    : `Your LHS admission Form ID: ${formId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={card}>
            {/* ── Header ── */}
            <Section style={headerBand}>
              <Text style={schoolName}>Lutheran High School, Obot Idim</Text>
              <Heading style={emailTitle}>
                {isSchoolCopy
                  ? "New Payment Verification Received"
                  : "Payment Received — Your Form ID"}
              </Heading>
            </Section>

            {/* ── Body ── */}
            <Section style={body}>
              {/* School-copy badge */}
              {isSchoolCopy && (
                <div style={schoolCopyBadge}>
                  📌 School Copy — Admin Reference
                </div>
              )}

              {/* Applicant copy greeting */}
              {!isSchoolCopy && (
                <>
                  <Text
                    style={{
                      color: "#334155",
                      fontSize: "15px",
                      lineHeight: "1.7",
                      margin: "0 0 16px",
                    }}
                  >
                    Dear <strong>{depositorName}</strong>,
                  </Text>
                  <Text
                    style={{
                      color: "#334155",
                      fontSize: "15px",
                      lineHeight: "1.7",
                      margin: "0 0 4px",
                    }}
                  >
                    Thank you for submitting your payment details for the{" "}
                    <strong>2026/2027</strong> admission process at Lutheran
                    High School, Obot Idim. Your unique Form ID is shown below.
                  </Text>
                </>
              )}

              {/* Form ID box */}
              <div style={formIdBox}>
                <Text style={formIdLabel}>Your Unique Form ID</Text>
                <Text style={formIdValue}>{formId}</Text>
              </div>

              {/* Notice for applicant */}
              {!isSchoolCopy && (
                <div style={noticeBox}>
                  <Text style={noticeParagraph}>
                    <strong>What happens next?</strong> Our team will validate
                    your ₦3,000 payment and contact you within{" "}
                    <strong>1-48 working hours</strong> with your entrance
                    examination schedule. Please keep your Form ID safe — you
                    will need it to fill and track your admission form.
                  </Text>
                </div>
              )}

              <Hr style={divider} />

              {/* Payment details table */}
              <Text
                style={{
                  color: "#6366f1",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  margin: "0 0 16px",
                }}
              >
                Payment Details Submitted
              </Text>

              <Row>
                <Column>
                  <Text style={label}>Depositor&apos;s Name</Text>
                  <Text style={value}>{depositorName}</Text>
                </Column>
                <Column>
                  <Text style={label}>Phone Number</Text>
                  <Text style={value}>{phone}</Text>
                </Column>
              </Row>

              {email && (
                <Row>
                  <Column>
                    <Text style={label}>Email Address</Text>
                    <Text style={value}>{email}</Text>
                  </Column>
                </Row>
              )}

              <Row>
                <Column>
                  <Text style={label}>Mode of Payment</Text>
                  <Text style={value}>{modeOfPayment}</Text>
                </Column>
                <Column>
                  <Text style={label}>Bank Paid To</Text>
                  <Text style={value}>{bankPaidTo}</Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text style={label}>Date & Time of Payment</Text>
                  <Text style={value}>{paymentDatetime}</Text>
                </Column>
                {transactionReference && (
                  <Column>
                    <Text style={label}>Transaction Reference</Text>
                    <Text style={value}>{transactionReference}</Text>
                  </Column>
                )}
              </Row>

              {/* School copy — admin instructions */}
              {isSchoolCopy && (
                <>
                  <Hr style={divider} />
                  <div style={noticeBox}>
                    <Text style={{ ...noticeParagraph, color: "#78350f" }}>
                      <strong>Admin Action Required:</strong> Please verify the
                      ₦3,000 payment in your bank statement and contact the
                      applicant within <strong>1-48 working hours</strong> with
                      an entrance examination date. The proof of payment image
                      is attached to this email.
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

export default PaymentVerificationEmail;
