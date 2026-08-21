import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/marketing/LegalDocument";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/terms",
  title: "Terms of Service — LocalLeadster",
  ogTitle: "Terms of Service",
  description:
    "Terms of Service for LocalLeadster: account use, subscriptions, Google Places data, demo websites, invoicing, and cancellation.",
  keywords: ["LocalLeadster terms", "LocalLeadster terms of service"],
});

export default function TermsPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Terms of Service" lastUpdated="August 21, 2026">
        <p>
          These Terms of Service (“Terms”) govern your access to and use of LocalLeadster
          (the “Service”), operated at localleadster.com. By creating an account, signing
          in with Google, or using the Service, you agree to these Terms. If you do not
          agree, do not use the Service.
        </p>

        <h2>1. The Service</h2>
        <p>
          LocalLeadster is a SaaS product that helps you find and manage local business
          prospects. Depending on your plan, features may include Google Places–powered
          territory search, lead scoring and CRM pipeline tools, demo website generation,
          branded PDF invoices, and data export. Features and limits may change as we
          improve the product; material changes to paid entitlements are described in our
          pricing and plan materials.
        </p>

        <h2>2. Eligibility and accounts</h2>
        <p>
          You must be at least 18 years old and able to form a binding contract. You are
          responsible for the accuracy of registration information, for keeping your
          credentials secure, and for activity under your account. You may sign up with
          email/password or Google OAuth. Notify us promptly at{" "}
          <a href="mailto:support@localleadster.com">support@localleadster.com</a> if you
          suspect unauthorized access.
        </p>

        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the Service to violate applicable law, including telemarketing, spam, or
            privacy laws (e.g., TCPA, CAN-SPAM, GDPR/CCPA where they apply to you).
          </li>
          <li>
            Scrape, resell, or systematically redistribute Google Places or other third-party
            data beyond personal use of the Service as intended.
          </li>
          <li>
            Probe, disrupt, or reverse engineer the Service except as allowed by law.
          </li>
          <li>
            Upload malware, attempt to bypass plan limits, share accounts in a way that
            circumvents billing, or impersonate others.
          </li>
          <li>
            Use generated demo websites or invoices to misrepresent ownership of a business
            you do not represent, or to engage in fraud.
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these Terms or create risk for
          other users or our infrastructure.
        </p>

        <h2>4. Google Places and third-party data</h2>
        <p>
          Business search results and related fields (name, address, phone, ratings, etc.)
          may come from Google Places and other sources. That data is subject to Google’s
          terms and policies. LocalLeadster does not guarantee completeness or accuracy of
          third-party listings. You are solely responsible for how you contact businesses
          and for verifying information before relying on it.
        </p>

        <h2>5. Demo websites and user content</h2>
        <p>
          If you generate a demo website or create invoices, notes, or other content in the
          Service (“User Content”), you retain ownership of your User Content. You grant us
          a limited license to host, process, and display it as needed to provide the
          Service. Demo pages are marketing tools for your outreach; you are responsible for
          their content and for obtaining any rights needed to use photos or brand materials
          you introduce.
        </p>

        <h2>6. Plans, billing, and cancellation</h2>
        <p>
          Free and paid plans have different limits (for example, searches, leads, and PDF
          invoices). Paid subscriptions are processed by Stripe. Prices, billing intervals,
          and entitlements are shown at checkout and on the Plan &amp; billing page. By
          starting a paid subscription you authorize recurring charges until you cancel.
        </p>
        <p>
          You may cancel a paid subscription through the Stripe customer portal linked from
          Plan &amp; billing, or by contacting support. Cancellation stops future renewals;
          you generally retain paid access through the end of the current billing period
          unless otherwise stated. Fees already paid are non-refundable except where required
          by law or where we expressly agree otherwise. Chargebacks without first contacting
          us may result in account suspension while we investigate.
        </p>

        <h2>7. Intellectual property</h2>
        <p>
          The Service, including software, design, trademarks, and documentation, is owned
          by LocalLeadster and its licensors. These Terms do not transfer ownership of our
          IP to you. Portfolio templates used for demos may incorporate third-party design
          assets licensed for that purpose; do not copy template code for unrelated commercial
          products without appropriate rights.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT
          PERMITTED BY LAW, WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant uninterrupted or
          error-free operation, or that leads will convert into revenue.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOCALLEADSTER AND ITS SUPPLIERS WILL NOT
          BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          OR FOR LOST PROFITS, DATA, OR GOODWILL. OUR TOTAL LIABILITY FOR CLAIMS ARISING OUT
          OF THE SERVICE IN ANY TWELVE-MONTH PERIOD WILL NOT EXCEED THE AMOUNTS YOU PAID US
          FOR THE SERVICE IN THAT PERIOD (OR USD $50 IF YOU ARE ON A FREE PLAN).
        </p>

        <h2>10. Indemnity</h2>
        <p>
          You will defend and indemnify LocalLeadster against claims arising from your use
          of the Service, your User Content, your outreach to businesses, or your violation
          of these Terms or applicable law.
        </p>

        <h2>11. Privacy</h2>
        <p>
          Our <Link href="/privacy">Privacy Policy</Link> explains how we collect and use
          personal data. By using the Service you acknowledge that processing.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these Terms from time to time. We will post the revised Terms with
          an updated “Last updated” date. Continued use after changes become effective
          constitutes acceptance. If you do not agree, stop using the Service and cancel any
          subscription.
        </p>

        <h2>13. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate access for
          violation of these Terms, non-payment, or risk to the Service. Upon termination,
          your right to use the Service ends; provisions that by nature should survive
          (including IP, disclaimers, limitation of liability, and indemnity) will survive.
        </p>

        <h2>14. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Commonwealth of Massachusetts, USA,
          without regard to conflict-of-law rules, except where mandatory consumer
          protections in your jurisdiction apply. Courts in Massachusetts will have exclusive
          jurisdiction, subject to those mandatory protections.
        </p>

        <h2>15. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:support@localleadster.com">support@localleadster.com</a> or our{" "}
          <Link href="/contact">contact form</Link>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
