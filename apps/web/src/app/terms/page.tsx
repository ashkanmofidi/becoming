import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Becoming..',
  description: 'Terms of Service for the Becoming.. Focus Timer application.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg-primary text-surface-100 px-4 py-12 sm:py-16">
      <article className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-10">
          <Link
            href="/timer"
            className="inline-flex items-center gap-1.5 text-surface-500 hover:text-surface-300 transition-colors text-sm font-mono mb-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to app
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl mb-2">Terms of Service</h1>
          <p className="text-surface-500 text-sm font-mono">
            Version 1.0 &middot; Last updated April 9, 2026
          </p>
        </header>

        {/* Body */}
        <div className="space-y-8 text-surface-300 leading-relaxed text-[15px]">

          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Becoming.. Focus Timer (&quot;Becoming..&quot;, &quot;the App&quot;,
              &quot;the Service&quot;) at{' '}
              <a
                href="https://becoming.ashmofidi.com"
                className="text-amber-light hover:text-amber-lighter underline underline-offset-2"
              >
                becoming.ashmofidi.com
              </a>
              , you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree
              to all of these Terms, you must not use the App.
            </p>
            <p className="mt-3">
              These Terms constitute a legally binding agreement between you (&quot;you&quot;, &quot;your&quot;,
              &quot;User&quot;) and Ashkan Mofidi (&quot;Developer&quot;, &quot;we&quot;, &quot;us&quot;,
              &quot;our&quot;), the sole developer and operator of Becoming.., based in San Jose, California,
              United States.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">2. Description of Service</h2>
            <p>
              Becoming.. is a web-based focus timer and productivity tool. The App allows you to run
              timed focus sessions, track your productivity patterns, set intentions for work sessions,
              and view analytics about your focus habits.
            </p>
            <p className="mt-3">
              The App is a productivity tool only. It is not a medical device, therapeutic tool,
              health monitoring application, or clinical intervention of any kind. The App does not
              provide medical advice, diagnosis, treatment recommendations, or mental health
              assessments. Nothing in the App should be interpreted as medical or health guidance.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">3. User Accounts</h2>
            <p>
              To use Becoming.., you must sign in using Google OAuth 2.0. By signing in, you authorize
              us to receive your display name, email address, and profile photo URL from Google.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Each account is intended for use by a single individual.</li>
              <li>
                You may not create multiple accounts for the same person, share your account
                credentials, or allow others to access your account.
              </li>
              <li>
                Accounts are non-transferable. You may not sell, trade, gift, or otherwise transfer
                your account to another person.
              </li>
              <li>
                You are responsible for all activity that occurs under your account. If you believe
                your account has been compromised, contact us immediately.
              </li>
              <li>
                We do not store your Google password. Authentication is handled entirely through
                Google&apos;s OAuth 2.0 protocol.
              </li>
            </ul>
          </section>

          {/* 4. User Content */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">4. User Content</h2>
            <p>
              &quot;User Content&quot; refers to any data you create or provide through the App,
              including but not limited to focus session records, intent text, session categories,
              user settings, and feedback submissions.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>Ownership.</strong> You retain full ownership of your User Content. We do not
                claim any intellectual property rights over your data.
              </li>
              <li>
                <strong>Limited license.</strong> By using the App, you grant us a limited,
                non-exclusive, royalty-free license to store, process, and display your User Content
                solely for the purpose of operating and providing the Service to you.
              </li>
              <li>
                <strong>Deletion.</strong> You may delete individual focus sessions, clear all session
                data, or delete your entire account at any time through the App&apos;s Settings.
                Upon account deletion, all User Content will be permanently removed from our systems
                within 30 days.
              </li>
            </ul>
          </section>

          {/* 5. Acceptable Use */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source
                code of the App, except where expressly permitted by applicable law.
              </li>
              <li>
                Scrape, crawl, or use automated tools to extract data from the App, including session
                data, user profiles, or any other content.
              </li>
              <li>
                Access, attempt to access, or tamper with another user&apos;s account, data, or
                sessions.
              </li>
              <li>
                Use the App to transmit malware, viruses, or any other harmful or malicious code.
              </li>
              <li>
                Interfere with or disrupt the App&apos;s servers, networks, or infrastructure.
              </li>
              <li>
                Use the App for any purpose that is unlawful, fraudulent, or prohibited by these
                Terms.
              </li>
              <li>
                Circumvent, disable, or otherwise interfere with any security-related features of the
                App, including authentication mechanisms and access controls.
              </li>
              <li>
                Use the App to monitor, surveil, or track another person&apos;s productivity or
                behavior without their knowledge and explicit consent.
              </li>
            </ul>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">6. Intellectual Property</h2>
            <p>
              The App, including but not limited to its name (&quot;Becoming..&quot;), source code,
              visual design, user interface, graphics, icons, audio files, documentation, and overall
              look and feel, is the intellectual property of Ashkan Mofidi and is protected by
              applicable copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-3">
              You may not copy, modify, distribute, sell, or lease any part of the App or its
              intellectual property, nor may you reverse engineer or attempt to extract the source
              code, except where permitted by applicable law or with prior written consent from the
              Developer.
            </p>
            <p className="mt-3">
              All trademarks, service marks, and trade names displayed in the App are the property
              of their respective owners.
            </p>
          </section>

          {/* 7. Limitation of Liability */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">7. Limitation of Liability</h2>
            <p>
              Becoming.. is provided as a free service. To the maximum extent permitted by applicable
              law:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>Maximum liability.</strong> The Developer&apos;s total cumulative liability to
                you for any and all claims arising out of or related to these Terms or the use of the
                App shall not exceed zero dollars ($0.00 USD), reflecting the free nature of the
                Service.
              </li>
              <li>
                <strong>No indirect damages.</strong> In no event shall the Developer be liable for
                any indirect, incidental, special, consequential, or punitive damages, including but
                not limited to loss of profits, loss of data, loss of goodwill, business
                interruption, or any other intangible losses, regardless of the theory of liability
                (contract, tort, strict liability, or otherwise), even if the Developer has been
                advised of the possibility of such damages.
              </li>
              <li>
                <strong>Service availability.</strong> The Developer does not guarantee that the App
                will be available at all times, uninterrupted, error-free, or free of harmful
                components.
              </li>
            </ul>
          </section>

          {/* 8. Indemnification */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless the Developer from and against any
              and all claims, liabilities, damages, losses, costs, and expenses (including reasonable
              attorneys&apos; fees) arising out of or in connection with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Your use of the App or any activity under your account.</li>
              <li>Your violation of these Terms.</li>
              <li>Your violation of any applicable law or regulation.</li>
              <li>
                Your infringement of any third party&apos;s intellectual property or other rights.
              </li>
              <li>
                Any content or data you submit, transmit, or make available through the App.
              </li>
            </ul>
          </section>

          {/* 9. Dispute Resolution */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">9. Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of California, United States, without regard to its conflict of law provisions.
            </p>
            <p className="mt-3">
              Any dispute, claim, or controversy arising out of or relating to these Terms or the
              use of the App shall be resolved exclusively in the state or federal courts located in
              Santa Clara County, California. You consent to the personal jurisdiction of such courts
              and waive any objection to venue in such courts.
            </p>
            <p className="mt-3">
              Before filing any formal legal action, you agree to first attempt to resolve the
              dispute informally by contacting us at{' '}
              <a href="mailto:ashkan.mofidi@gmail.com" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                ashkan.mofidi@gmail.com
              </a>
              . We will attempt to resolve the dispute informally within 30 days. If the dispute is
              not resolved within that period, either party may proceed with formal legal action.
            </p>
          </section>

          {/* 10. Termination */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">10. Termination</h2>
            <p>
              Either party may terminate this agreement at any time, for any reason:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>By the Developer.</strong> We reserve the right to suspend or terminate your
                account and access to the App at any time, with or without cause, and with or without
                notice. Reasons for termination may include, but are not limited to, violation of
                these Terms, abusive behavior, or operational necessity.
              </li>
              <li>
                <strong>By the User.</strong> You may delete your account at any time through the
                App&apos;s Settings. Account deletion is immediate and irreversible.
              </li>
              <li>
                <strong>Data after termination.</strong> Upon account deletion or termination, all of
                your data, including your profile, focus sessions, settings, and feedback submissions,
                will be permanently deleted from our systems within 30 days. During this 30-day grace
                period, your data is retained solely for technical processing of the deletion and is
                not accessible or recoverable by you.
              </li>
            </ul>
            <p className="mt-3">
              Sections 6 (Intellectual Property), 7 (Limitation of Liability), 8 (Indemnification),
              and 9 (Dispute Resolution) shall survive any termination of these Terms.
            </p>
          </section>

          {/* 11. Modifications */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">11. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes,
              we will update the &quot;Last updated&quot; date at the top of this page and, where
              appropriate, provide notice within the App or via the email address associated with
              your account.
            </p>
            <p className="mt-3">
              Your continued use of the App after any modifications to these Terms constitutes your
              acceptance of the updated Terms. If you do not agree with the modified Terms, you must
              stop using the App and delete your account.
            </p>
          </section>

          {/* 12. Disclaimers */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">12. Disclaimers</h2>
            <p>
              The App is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without
              warranties of any kind, either express or implied. To the fullest extent permitted by
              applicable law, the Developer expressly disclaims all warranties, including but not
              limited to implied warranties of merchantability, fitness for a particular purpose,
              title, and non-infringement.
            </p>
            <p className="mt-3">
              Without limiting the foregoing, the Developer makes the following specific disclaimers:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>Not medical advice.</strong> The App is not a medical device, health
                application, or therapeutic tool. Focus session data and productivity analytics are
                not medical data and should not be used to diagnose, treat, or manage any health
                condition. If you have concerns about your health, consult a qualified healthcare
                professional.
              </li>
              <li>
                <strong>Not an employment monitoring tool.</strong> The App is designed for personal,
                voluntary use. It is not intended to be used by employers to monitor, evaluate,
                surveil, or manage employee productivity. The Developer is not responsible for any
                misuse of the App as an employment monitoring or surveillance tool.
              </li>
              <li>
                <strong>No guarantees of results.</strong> The Developer makes no guarantees that use
                of the App will improve your productivity, focus, or performance. Results, if any,
                depend on individual effort and circumstances.
              </li>
              <li>
                <strong>No uptime guarantee.</strong> The Developer does not guarantee that the App
                will be available at all times or that it will be free from errors, bugs, or
                interruptions.
              </li>
            </ul>
          </section>

          {/* 13. Third-Party Services */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">13. Third-Party Services</h2>
            <p>
              The App relies on third-party services to operate. Your use of the App is also subject
              to the terms and policies of these providers:
            </p>
            <div className="mt-3 space-y-3">
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Google</p>
                <p className="text-sm mt-1">
                  Authentication via OAuth 2.0. Your use of Google sign-in is subject to{' '}
                  <a href="https://policies.google.com/terms" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    Google&apos;s Terms of Service
                  </a>.
                </p>
              </div>
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Vercel</p>
                <p className="text-sm mt-1">
                  Hosting, serverless functions, and edge network delivery.{' '}
                  <a href="https://vercel.com/legal/terms" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    Vercel Terms of Service
                  </a>.
                </p>
              </div>
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Upstash</p>
                <p className="text-sm mt-1">
                  Data storage via Redis. All user data, session records, and settings are stored
                  with Upstash.{' '}
                  <a href="https://upstash.com/trust/terms" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    Upstash Terms of Service
                  </a>.
                </p>
              </div>
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Pusher</p>
                <p className="text-sm mt-1">
                  Real-time synchronization between devices.{' '}
                  <a href="https://pusher.com/legal/terms" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    Pusher Terms of Service
                  </a>.
                </p>
              </div>
            </div>
            <p className="mt-3">
              The Developer is not responsible for the availability, accuracy, or practices of any
              third-party service. If a third-party service experiences downtime or changes its
              terms, it may affect the availability or functionality of the App.
            </p>
          </section>

          {/* 14. Age Requirement */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">14. Age Requirement</h2>
            <p>
              You must be at least 13 years of age to use Becoming... By using the App, you
              represent and warrant that you are at least 13 years old. If you are under 18, you
              represent that you have obtained the consent of a parent or legal guardian to use the
              App and that they have read and agreed to these Terms on your behalf.
            </p>
            <p className="mt-3">
              If we learn that a user is under 13 years of age, we will promptly terminate their
              account and delete all associated data. If you believe that a child under 13 is using
              the App, please contact us at{' '}
              <a href="mailto:ashkan.mofidi@gmail.com" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                ashkan.mofidi@gmail.com
              </a>
              .
            </p>
          </section>

          {/* 15. Force Majeure */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">15. Force Majeure</h2>
            <p>
              The Developer shall not be liable for any failure or delay in performing obligations
              under these Terms if such failure or delay results from circumstances beyond the
              Developer&apos;s reasonable control, including but not limited to: acts of God, natural
              disasters, pandemics, war, terrorism, riots, government actions, power failures,
              internet or telecommunications outages, cyberattacks, or failures of third-party
              service providers (including but not limited to Google, Vercel, Upstash, and Pusher).
            </p>
          </section>

          {/* 16. General Provisions */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">16. General Provisions</h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Entire agreement.</strong> These Terms, together with the{' '}
                <Link href="/privacy" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                  Privacy Policy
                </Link>
                , constitute the entire agreement between you and the Developer regarding the use
                of the App.
              </li>
              <li>
                <strong>Severability.</strong> If any provision of these Terms is found to be
                unenforceable or invalid, that provision shall be limited or eliminated to the minimum
                extent necessary, and the remaining provisions shall remain in full force and effect.
              </li>
              <li>
                <strong>Waiver.</strong> The failure of the Developer to exercise or enforce any right
                or provision of these Terms shall not constitute a waiver of such right or provision.
              </li>
              <li>
                <strong>Assignment.</strong> You may not assign or transfer these Terms or your rights
                under them without the Developer&apos;s prior written consent. The Developer may
                assign these Terms without restriction.
              </li>
            </ul>
          </section>

          {/* 17. Contact Information */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">17. Contact Information</h2>
            <p>
              If you have any questions, concerns, or requests regarding these Terms of Service,
              you may contact us at:
            </p>
            <div className="mt-3 bg-bg-card border border-surface-900 rounded-lg p-4">
              <p className="text-surface-100 font-medium">Ashkan Mofidi</p>
              <p className="text-sm mt-1">San Jose, California, United States</p>
              <p className="text-sm mt-1">
                <a href="mailto:ashkan.mofidi@gmail.com" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                  ashkan.mofidi@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-6 border-t border-surface-900 text-surface-500 text-sm font-mono">
            <p>Version 1.0 &middot; Last updated April 9, 2026</p>
            <p className="mt-2">
              <Link href="/timer" className="hover:text-surface-300 transition-colors underline underline-offset-2">
                Back to app
              </Link>
              {' '}&middot;{' '}
              <Link href="/privacy" className="hover:text-surface-300 transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>
          </footer>
        </div>
      </article>
    </main>
  );
}
