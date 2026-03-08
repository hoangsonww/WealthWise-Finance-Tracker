import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the WealthWise terms of service, user responsibilities, legal limitations, and account usage conditions.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | WealthWise",
    description:
      "Read the WealthWise terms of service, user responsibilities, legal limitations, and account usage conditions.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>
      </div>

      <div className="space-y-8">
        {/* 1. Acceptance of Terms */}
        <section>
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            By accessing or using WealthWise (&quot;the Service&quot;), you agree to be bound by
            these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms,
            you may not access or use the Service. These Terms constitute a legally binding
            agreement between you and WealthWise regarding your use of the Service.
          </p>
        </section>

        {/* 2. Description of Service */}
        <section>
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            WealthWise is a personal finance management platform that provides tools to help you
            organize and understand your financial life. The Service includes, but is not limited
            to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>Tracking income and expenses across multiple accounts</li>
            <li>Creating and managing budgets by category</li>
            <li>Setting and monitoring financial goals</li>
            <li>Viewing financial summaries, reports, and trends</li>
            <li>Categorizing and searching transactions</li>
          </ul>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            WealthWise is designed as a personal financial management tool. It is not a bank,
            payment processor, or financial advisor. All financial data within the Service is
            entered and managed by you.
          </p>
        </section>

        {/* 3. Account Registration */}
        <section>
          <h2 className="text-xl font-semibold">3. Account Registration</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            To use WealthWise, you must create an account. When registering, you agree to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information to keep it accurate</li>
            <li>
              Maintain the security of your password and accept responsibility for all activity
              under your account
            </li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            You must be at least 18 years of age to create an account and use the Service. By
            registering, you represent and warrant that you meet this age requirement.
          </p>
        </section>

        {/* 4. User Responsibilities */}
        <section>
          <h2 className="text-xl font-semibold">4. User Responsibilities</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            You are responsible for your use of the Service and any data you provide. You agree not
            to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>
              Use the Service for any unlawful purpose or in violation of any applicable laws or
              regulations
            </li>
            <li>Enter intentionally misleading or fraudulent financial data</li>
            <li>
              Attempt to gain unauthorized access to any part of the Service or its related systems
            </li>
            <li>
              Use automated scripts, bots, scrapers, or other automated means to access or collect
              data from the Service
            </li>
            <li>
              Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source
              code of the Service
            </li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>
              Share your account credentials with third parties or allow others to access your
              account
            </li>
          </ul>
        </section>

        {/* 5. Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            The Service and its original content, features, functionality, branding, and design are
            owned by WealthWise and are protected by international copyright, trademark, patent,
            trade secret, and other intellectual property laws. Our trademarks, logos, and service
            marks may not be used in connection with any product or service without prior written
            consent.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            You retain ownership of all financial data you enter into the Service. By using
            WealthWise, you grant us a limited license to store, process, and display your data
            solely for the purpose of providing the Service to you.
          </p>
        </section>

        {/* 6. Privacy */}
        <section>
          <h2 className="text-xl font-semibold">6. Privacy</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Your privacy is important to us. Our{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Privacy Policy
            </Link>{" "}
            describes how we collect, use, store, and protect your personal and financial
            information. By using the Service, you consent to the data practices described in our
            Privacy Policy.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We do not sell your personal or financial data to third parties. Your data is used
            solely to provide and improve the Service.
          </p>
        </section>

        {/* 7. Data Security */}
        <section>
          <h2 className="text-xl font-semibold">7. Data Security</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We take the security of your data seriously and implement industry-standard measures to
            protect it, including:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>Encryption of data at rest using AES-256 encryption</li>
            <li>Encryption of data in transit using TLS (Transport Layer Security)</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Strict access controls and authentication mechanisms</li>
          </ul>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            While we strive to protect your information, no method of electronic storage or
            transmission over the internet is 100% secure. We cannot guarantee absolute security of
            your data and are not liable for any unauthorized access that occurs despite our
            reasonable security measures.
          </p>
        </section>

        {/* 8. Third-Party Services */}
        <section>
          <h2 className="text-xl font-semibold">8. Third-Party Services</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            The Service may contain links to or integrations with third-party websites, services, or
            applications that are not owned or controlled by WealthWise. We have no control over and
            assume no responsibility for the content, privacy policies, or practices of any
            third-party services.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Your use of any third-party service is at your own risk and subject to that third
            party&apos;s terms and conditions. We encourage you to review the terms and privacy
            policies of any third-party services you interact with through WealthWise.
          </p>
        </section>

        {/* 9. Limitation of Liability */}
        <section>
          <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
          <p className="mt-3 font-medium leading-relaxed text-foreground text-muted-foreground">
            WealthWise is not a financial advisor, investment advisor, tax advisor, or licensed
            financial professional. The Service is provided for informational and organizational
            purposes only.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            <li>
              Any financial information displayed within the Service is based on data you provide
              and should not be considered financial advice
            </li>
            <li>
              You are solely responsible for your financial decisions. WealthWise shall not be held
              liable for any financial losses or damages resulting from decisions made based on
              information provided through the Service
            </li>
            <li>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied
            </li>
            <li>
              To the maximum extent permitted by law, WealthWise shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the Service
            </li>
          </ul>
        </section>

        {/* 10. Termination */}
        <section>
          <h2 className="text-xl font-semibold">10. Termination</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We reserve the right to suspend or terminate your account and access to the Service at
            our sole discretion, without prior notice, for conduct that we determine violates these
            Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            You may delete your account at any time through the account settings. Upon deletion,
            your data will be permanently removed from our systems in accordance with our{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Privacy Policy
            </Link>
            . Some data may be retained for a limited period as required by law or for legitimate
            business purposes such as fraud prevention.
          </p>
        </section>

        {/* 11. Modifications */}
        <section>
          <h2 className="text-xl font-semibold">11. Modifications to Terms</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We reserve the right to modify these Terms at any time. When we make changes, we will
            update the &quot;Last updated&quot; date at the top of this page and, for material
            changes, notify you via email or through an in-app notification.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Your continued use of the Service after any modifications to the Terms constitutes your
            acceptance of the updated Terms. If you do not agree to the revised Terms, you should
            discontinue your use of the Service.
          </p>
        </section>

        {/* 12. Governing Law */}
        <section>
          <h2 className="text-xl font-semibold">12. Governing Law</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law provisions. Any disputes arising under or in
            connection with these Terms shall be subject to the exclusive jurisdiction of the courts
            in the applicable jurisdiction.
          </p>
        </section>

        {/* 13. Contact Information */}
        <section>
          <h2 className="text-xl font-semibold">13. Contact Information</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <a
              href="mailto:hoangson091104@gmail.com"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              hoangson091104@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
