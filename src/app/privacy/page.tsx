import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/marketing/LegalDocument";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/privacy",
  title: "Privacy Policy — LocalLeadster",
  ogTitle: "Privacy Policy",
  description:
    "How LocalLeadster collects, uses, and stores account, billing, and Google Places–sourced business data. Covers Google, Stripe, Resend, and Neon.",
  keywords: ["LocalLeadster privacy", "LocalLeadster privacy policy"],
});

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Privacy Policy" lastUpdated="August 21, 2026">
        <p>
          This Privacy Policy describes how LocalLeadster (“we,” “us”) collects, uses, and
          shares information when you use localleadster.com and related services (the
          “Service”). By using the Service you agree to this Policy. For product terms, see
          our <Link href="/terms">Terms of Service</Link>.
        </p>

        <h2>1. Who we are</h2>
        <p>
          LocalLeadster is a SaaS application for local business prospecting, CRM pipeline
          management, demo website generation, and invoicing. Contact:{" "}
          <a href="mailto:support@localleadster.com">support@localleadster.com</a>.
        </p>

        <h2>2. Information we collect</h2>
        <h3>Account and profile</h3>
        <ul>
          <li>
            Email address, name, password (hashed), and profession/role you select at signup.
          </li>
          <li>
            If you use Google Sign-In: profile identifiers Google provides (such as email and
            name) via OAuth. We do not receive your Google password.
          </li>
        </ul>
        <h3>Business and CRM data you create or import</h3>
        <ul>
          <li>
            Search queries (e.g., city, business type) and results returned from Google Places
            (business name, address, phone, website, ratings, photos URLs, place IDs, and
            similar fields).
          </li>
          <li>
            Leads you save, including contact status, notes, follow-up dates, point-of-contact
            fields, quotes, invoice drafts, and demo website HTML you generate.
          </li>
          <li>Invoices and exports you create (PDF/text/CSV/JSON as applicable).</li>
        </ul>
        <h3>Billing</h3>
        <ul>
          <li>
            Subscription status, plan entitlements, and Stripe customer/subscription IDs.
            Payment card details are collected and processed by Stripe; we do not store full
            card numbers on our servers.
          </li>
        </ul>
        <h3>Support and communications</h3>
        <ul>
          <li>
            Messages and attachments you send via our contact or in-app support forms,
            delivered through email (Resend).
          </li>
        </ul>
        <h3>Technical and usage data</h3>
        <ul>
          <li>
            IP address, browser type, device information, pages viewed, and approximate
            timestamps. If product analytics (e.g., PostHog) is configured, we may also
            collect product events such as signups, searches, and upgrade flows, including
            UTM parameters from your first landing visit.
          </li>
          <li>Cookies and similar technologies needed for authentication and preferences.</li>
        </ul>

        <h2>3. How we use information</h2>
        <ul>
          <li>Provide, secure, and improve the Service.</li>
          <li>Authenticate users and enforce plan limits and entitlements.</li>
          <li>Process subscriptions and send billing-related notices.</li>
          <li>
            Send transactional email (password reset, support replies, important account
            notices). We do not sell your email list.
          </li>
          <li>
            Analyze product usage to improve features (when analytics is enabled) and
            diagnose errors.
          </li>
          <li>Comply with law and protect against abuse or fraud.</li>
        </ul>

        <h2>4. Legal bases (EEA/UK users)</h2>
        <p>Where GDPR/UK GDPR applies, we process personal data based on:</p>
        <ul>
          <li>Contract — to provide the Service you request.</li>
          <li>Legitimate interests — security, product improvement, and fraud prevention.</li>
          <li>Consent — where required (e.g., certain cookies or optional analytics).</li>
          <li>Legal obligation — when we must retain or disclose information.</li>
        </ul>

        <h2>5. Third-party processors</h2>
        <p>We use service providers who process data on our behalf:</p>
        <ul>
          <li>
            <strong>Google</strong> — OAuth sign-in and Places API for business search data.
            Use of Google APIs is also subject to Google’s privacy policies and Places terms.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing and subscription management.
          </li>
          <li>
            <strong>Resend</strong> — transactional and support-related email delivery.
          </li>
          <li>
            <strong>Neon</strong> — hosted PostgreSQL database for application data.
          </li>
          <li>
            <strong>Hosting / CDN providers</strong> (e.g., Vercel) — application hosting and
            edge delivery.
          </li>
          <li>
            <strong>PostHog</strong> (if configured) — product analytics.
          </li>
        </ul>
        <p>
          These providers process data under their own terms and security practices. We do
          not sell personal information.
        </p>

        <h2>6. Sharing</h2>
        <p>We share information only as needed to:</p>
        <ul>
          <li>Operate the Service through the processors above.</li>
          <li>Respond to lawful requests from authorities.</li>
          <li>
            Protect rights, safety, and integrity of the Service and our users.
          </li>
          <li>
            Complete a merger, acquisition, or asset sale (with notice where required).
          </li>
        </ul>
        <p>
          Demo website URLs you create may be publicly reachable by anyone with the link.
          Do not put sensitive personal data in demos you share.
        </p>

        <h2>7. Data retention</h2>
        <p>
          We retain account and CRM data while your account is active. After you delete a
          lead or request account deletion, we remove associated records from active systems
          within a reasonable period, subject to backups and legal retention needs (e.g.,
          billing records). Stripe retains payment records per its policies. Support emails
          may be retained as needed to resolve issues and prevent abuse.
        </p>
        <p>
          To request deletion of your account and associated personal data, contact{" "}
          <a href="mailto:support@localleadster.com">support@localleadster.com</a>. We may
          need to verify identity before fulfilling the request.
        </p>

        <h2>8. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete,
          export, or restrict processing of your personal data, and to object to certain
          processing. California residents may have additional rights under the CCPA/CPRA
          (including to know, delete, and opt out of “sale”/“sharing” — we do not sell
          personal information as those terms are commonly defined). To exercise rights,
          email <a href="mailto:support@localleadster.com">support@localleadster.com</a>.
        </p>

        <h2>9. Security</h2>
        <p>
          We use industry-standard measures such as HTTPS, hashed passwords, and access
          controls. No method of transmission or storage is 100% secure; please use a strong
          unique password and protect your Google account.
        </p>

        <h2>10. International transfers</h2>
        <p>
          We and our processors may process data in the United States and other countries.
          Where required, we rely on appropriate safeguards (such as standard contractual
          clauses used by our providers).
        </p>

        <h2>11. Children</h2>
        <p>
          The Service is not directed to children under 16 (or the minimum age in your
          jurisdiction). We do not knowingly collect personal data from children.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update this Policy and will post the new version with a revised “Last
          updated” date. Continued use after changes means you accept the updated Policy.
        </p>

        <h2>13. Contact</h2>
        <p>
          Privacy questions:{" "}
          <a href="mailto:support@localleadster.com">support@localleadster.com</a> or our{" "}
          <Link href="/contact">contact form</Link>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
