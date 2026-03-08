import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read how WealthWise collects, uses, and protects your personal and financial information.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | WealthWise",
    description:
      "Read how WealthWise collects, uses, and protects your personal and financial information.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>
      </div>

      <div className="space-y-8">
        {/* 1. Introduction */}
        <section>
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            At WealthWise, we are committed to protecting your privacy and ensuring the security of
            your personal and financial information. This Privacy Policy explains what information
            we collect, how we use it, how we protect it, and what choices you have regarding your
            data.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            By using WealthWise (&quot;the Service&quot;), you agree to the collection and use of
            information in accordance with this policy. We encourage you to read this policy
            carefully and contact us if you have any questions.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section>
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>

          <h3 className="mt-4 text-lg font-medium">Account Information</h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            When you create an account, we collect basic information necessary to provide the
            Service:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6 leading-relaxed text-muted-foreground">
            <li>Your name</li>
            <li>Email address</li>
            <li>
              Password (stored in hashed form; we never store or have access to your plain-text
              password)
            </li>
          </ul>

          <h3 className="mt-4 text-lg font-medium">Financial Data</h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            All financial data within WealthWise is entered and managed by you. This may include:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6 leading-relaxed text-muted-foreground">
            <li>Transaction records (amounts, dates, descriptions, categories)</li>
            <li>Account names and balances</li>
            <li>Budget configurations and spending limits</li>
            <li>Financial goals and savings targets</li>
          </ul>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            WealthWise does not connect to your bank accounts or financial institutions directly.
            All financial data is manually entered by you and remains under your control.
          </p>

          <h3 className="mt-4 text-lg font-medium">Usage Data</h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            We automatically collect certain information when you use the Service to help us improve
            your experience:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6 leading-relaxed text-muted-foreground">
            <li>Pages visited and features used</li>
            <li>Time spent on different sections of the application</li>
            <li>Device type, browser type, and operating system</li>
            <li>IP address and approximate geographic location</li>
            <li>Referring URLs and how you arrived at the Service</li>
          </ul>

          <h3 className="mt-4 text-lg font-medium">Cookies and Similar Technologies</h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            We use cookies and similar tracking technologies to maintain your session, remember your
            preferences, and understand how you interact with the Service. You can control cookie
            settings through your browser preferences, though disabling cookies may affect the
            functionality of the Service.
          </p>
        </section>

        {/* 3. How We Use Your Information */}
        <section>
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We use the information we collect for the following purposes:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Providing the Service:</span> Storing
              and displaying your financial data, generating reports, and powering the core features
              of WealthWise
            </li>
            <li>
              <span className="font-medium text-foreground">Improving the Service:</span> Analyzing
              usage patterns to identify areas for improvement, fix bugs, and develop new features
            </li>
            <li>
              <span className="font-medium text-foreground">Communications:</span> Sending
              transactional emails (password resets, account notifications), and optional product
              updates or tips that you can opt out of at any time
            </li>
            <li>
              <span className="font-medium text-foreground">Customer Support:</span> Responding to
              your requests, troubleshooting issues, and providing assistance
            </li>
            <li>
              <span className="font-medium text-foreground">Security:</span> Detecting and
              preventing fraud, abuse, and unauthorized access to the Service
            </li>
          </ul>
        </section>

        {/* 4. Data Storage and Security */}
        <section>
          <h2 className="text-xl font-semibold">4. Data Storage and Security</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We implement robust security measures to protect your data:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Encryption at rest:</span> All stored
              data is encrypted using AES-256 encryption
            </li>
            <li>
              <span className="font-medium text-foreground">Encryption in transit:</span> All data
              transmitted between your device and our servers is protected with TLS (Transport Layer
              Security)
            </li>
            <li>
              <span className="font-medium text-foreground">Access controls:</span> Strict
              role-based access controls limit who can access production data within our
              organization
            </li>
            <li>
              <span className="font-medium text-foreground">Regular audits:</span> We conduct
              periodic security audits and vulnerability assessments to identify and address
              potential risks
            </li>
            <li>
              <span className="font-medium text-foreground">Password security:</span> Passwords are
              hashed using industry-standard algorithms and are never stored in plain text
            </li>
          </ul>
        </section>

        {/* 5. Data Sharing */}
        <section>
          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p className="mt-3 font-medium leading-relaxed text-foreground text-muted-foreground">
            We do not sell, rent, or trade your personal or financial data to third parties.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We may share limited information only in the following circumstances:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Service providers:</span> We work with
              trusted third-party providers who assist in operating the Service (such as hosting,
              analytics, and email delivery). These providers are contractually obligated to protect
              your data and may only use it to perform services on our behalf
            </li>
            <li>
              <span className="font-medium text-foreground">Legal requirements:</span> We may
              disclose your information if required to do so by law, regulation, legal process, or
              governmental request
            </li>
            <li>
              <span className="font-medium text-foreground">Safety and protection:</span> We may
              share information when we believe in good faith that disclosure is necessary to
              protect the rights, property, or safety of WealthWise, our users, or the public
            </li>
          </ul>
        </section>

        {/* 6. Your Rights */}
        <section>
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            You have the following rights regarding your data:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Access your data:</span> You can view
              all personal and financial data associated with your account at any time through the
              Service
            </li>
            <li>
              <span className="font-medium text-foreground">Export your data:</span> You can export
              your financial data in CSV or JSON format through the account settings, giving you
              full portability of your information
            </li>
            <li>
              <span className="font-medium text-foreground">Delete your account and data:</span> You
              can delete your account at any time through the account settings. Upon deletion, all
              your personal and financial data will be permanently removed from our active systems
            </li>
            <li>
              <span className="font-medium text-foreground">Opt out of communications:</span> You
              can unsubscribe from optional product updates and marketing emails at any time.
              Transactional emails related to your account security and service operation will
              continue
            </li>
            <li>
              <span className="font-medium text-foreground">Correct your data:</span> You can update
              or correct your personal information through the account settings at any time
            </li>
          </ul>
        </section>

        {/* 7. Data Retention */}
        <section>
          <h2 className="text-xl font-semibold">7. Data Retention</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We retain your personal and financial data for as long as your account is active and as
            needed to provide you with the Service.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            When you delete your account, we will permanently delete your data from our active
            systems within 30 days. Some data may be retained in encrypted backups for up to 90 days
            after deletion, after which it will be permanently removed. We may retain certain
            anonymized, aggregated data that cannot be linked back to you for analytical purposes.
          </p>
        </section>

        {/* 8. Children's Privacy */}
        <section>
          <h2 className="text-xl font-semibold">8. Children&apos;s Privacy</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            WealthWise is not designed for or directed at individuals under the age of 18. We do not
            knowingly collect personal information from children. If we become aware that we have
            collected data from a person under 18, we will take steps to delete that information
            promptly. If you believe a child has provided us with personal data, please contact us
            at{" "}
            <a
              href="mailto:hoangson091104@gmail.com"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              hoangson091104@gmail.com
            </a>
            .
          </p>
        </section>

        {/* 9. International Data */}
        <section>
          <h2 className="text-xl font-semibold">9. International Data Transfers</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Your data may be processed and stored in servers located in different jurisdictions. By
            using the Service, you consent to the transfer of your information to facilities and
            servers located outside of your jurisdiction, where data protection laws may differ from
            those in your country.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We take appropriate safeguards to ensure that your data is treated securely and in
            accordance with this Privacy Policy regardless of where it is processed or stored.
          </p>
        </section>

        {/* 10. Changes to Policy */}
        <section>
          <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technology, legal requirements, or other factors. When we make changes, we will:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>Update the &quot;Last updated&quot; date at the top of this page</li>
            <li>Notify you of material changes via email or through an in-app notification</li>
            <li>Provide a summary of what changed for significant updates</li>
          </ul>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Your continued use of the Service after any changes to this Privacy Policy constitutes
            your acceptance of the updated policy. We encourage you to review this page
            periodically.
          </p>
        </section>

        {/* 11. Contact Us */}
        <section>
          <h2 className="text-xl font-semibold">11. Contact Us</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            If you have any questions, concerns, or requests regarding this Privacy Policy or how we
            handle your data, please contact us at:
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <a
              href="mailto:hoangson091104@gmail.com"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              hoangson091104@gmail.com
            </a>
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We will respond to your inquiry within 30 days. For data deletion or export requests, we
            will process your request within the timeframes described in our{" "}
            <Link
              href="/terms"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
