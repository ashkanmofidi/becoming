import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Becoming..',
  description: 'Privacy Policy for the Becoming.. Enterprise Focus Timer application.',
};

export default function PrivacyPage() {
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
          <h1 className="font-serif text-3xl sm:text-4xl mb-2">Privacy Policy</h1>
          <p className="text-surface-500 text-sm font-mono">
            Version 1.0 &middot; Last updated April 9, 2026
          </p>
        </header>

        {/* Body */}
        <div className="space-y-8 text-surface-300 leading-relaxed text-[15px]">

          {/* 1. Introduction */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">1. Introduction</h2>
            <p>
              This Privacy Policy explains how Becoming.. Enterprise Focus Timer
              (&quot;Becoming..&quot;, &quot;the App&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
              collects, uses, stores, and protects your personal information. The App is developed
              and operated by Ashkan Mofidi, based in San Jose, California, United States.
            </p>
            <p className="mt-3">
              By using Becoming.. at{' '}
              <a
                href="https://becoming.ashmofidi.com"
                className="text-amber-light hover:text-amber-lighter underline underline-offset-2"
              >
                becoming.ashmofidi.com
              </a>
              , you agree to the collection and use of your information as described in this policy.
              If you do not agree, please discontinue use of the App.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-surface-100 text-base font-medium mt-4 mb-2">2.1 Account Information (via Google OAuth)</h3>
            <p>
              When you sign in with Google, we receive and store the following from your Google account:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Your display name</li>
              <li>Your email address</li>
              <li>Your profile photo URL</li>
            </ul>
            <p className="mt-2">
              We do not receive or store your Google account password. Authentication is handled
              entirely through Google&apos;s OAuth 2.0 protocol.
            </p>

            <h3 className="text-surface-100 text-base font-medium mt-4 mb-2">2.2 Focus Session Data</h3>
            <p>When you use the timer, we collect and store:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Session start time and end time</li>
              <li>Session duration</li>
              <li>Session mode (focus or break)</li>
              <li>Intent text (what you planned to work on)</li>
              <li>Session category</li>
            </ul>

            <h3 className="text-surface-100 text-base font-medium mt-4 mb-2">2.3 User Settings</h3>
            <p>We store your in-app preferences, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Timer duration settings (focus length, break length)</li>
              <li>Sound preferences</li>
              <li>Display preferences</li>
              <li>Accessibility preferences</li>
            </ul>

            <h3 className="text-surface-100 text-base font-medium mt-4 mb-2">2.4 Feedback Submissions</h3>
            <p>When you submit feedback through the App, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Subject line</li>
              <li>Description text</li>
              <li>Feedback category</li>
              <li>Screenshots, if you choose to attach them</li>
            </ul>

            <h3 className="text-surface-100 text-base font-medium mt-4 mb-2">2.5 Device and Network Information</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>User agent string</strong> &mdash; stored alongside session records to identify
                the browser and device used
              </li>
              <li>
                <strong>IP address</strong> &mdash; stored in audit logs and authentication records
                for security purposes
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Authenticate your identity and maintain your session</li>
              <li>Record and display your focus session history and productivity analytics</li>
              <li>Save and apply your personalized settings across devices</li>
              <li>Respond to your feedback and improve the App</li>
              <li>Detect and prevent unauthorized access or abuse</li>
              <li>Maintain audit logs for security and integrity</li>
            </ul>
            <p className="mt-3">
              We do not use your data for advertising, profiling, or behavioral targeting.
              We do not sell, rent, or share your personal information with advertisers or
              data brokers.
            </p>
          </section>

          {/* 4. Lawful Basis for Processing (GDPR) */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">4. Lawful Basis for Processing (GDPR)</h2>
            <p>
              For users in the European Economic Area (EEA) and United Kingdom, we process your
              personal data under the following legal bases:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>Contractual necessity</strong> &mdash; Processing your account information and
                focus session data is necessary to provide the service you signed up for.
              </li>
              <li>
                <strong>Legitimate interest</strong> &mdash; We process device information and IP
                addresses for security, fraud prevention, and service improvement, balanced against
                your privacy rights.
              </li>
              <li>
                <strong>Consent</strong> &mdash; Feedback submissions, including optional screenshots,
                are collected only when you voluntarily choose to submit them.
              </li>
            </ul>
          </section>

          {/* 5. Cookies and Tracking */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">5. Cookies and Tracking</h2>
            <p>
              Becoming.. uses a single essential session cookie:
            </p>
            <div className="mt-3 bg-bg-card border border-surface-900 rounded-lg p-4 font-mono text-sm">
              <p><strong className="text-surface-100">Cookie name:</strong> bm_sid</p>
              <p><strong className="text-surface-100">Purpose:</strong> Session authentication</p>
              <p><strong className="text-surface-100">Type:</strong> Essential (required for the App to function)</p>
              <p><strong className="text-surface-100">Attributes:</strong> HttpOnly, Secure, SameSite=Lax</p>
              <p><strong className="text-surface-100">Expiry:</strong> 3 days</p>
            </div>
            <p className="mt-3">
              We do not use any third-party analytics cookies, advertising cookies, or tracking
              pixels. There are no third-party trackers embedded in the App.
            </p>
          </section>

          {/* 6. Data Storage and Security */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">6. Data Storage and Security</h2>
            <p>
              All user data is stored in Upstash Redis servers located in the United States,
              accessed through Vercel KV. We implement the following security measures:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>Encryption at rest</strong> &mdash; All data stored in Upstash Redis is
                encrypted at rest by default.
              </li>
              <li>
                <strong>Encryption in transit</strong> &mdash; All communication between your browser
                and our servers uses TLS/HTTPS encryption.
              </li>
              <li>
                <strong>Session security</strong> &mdash; Authentication cookies are HttpOnly
                (inaccessible to JavaScript), Secure (transmitted only over HTTPS), and
                SameSite=Lax (protection against cross-site request forgery).
              </li>
              <li>
                <strong>Access controls</strong> &mdash; Only authenticated users can access their
                own data. Administrative access is restricted to authorized personnel.
              </li>
            </ul>
          </section>

          {/* 7. Third-Party Services (Sub-Processors) */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">7. Third-Party Services (Sub-Processors)</h2>
            <p>
              We rely on the following third-party services to operate the App. Each processes
              data only as necessary to provide their respective service:
            </p>
            <div className="mt-3 space-y-3">
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Vercel</p>
                <p className="text-sm mt-1">
                  Hosting, serverless functions, and edge network delivery.
                  <br />
                  <a href="https://vercel.com/legal/privacy-policy" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    vercel.com
                  </a>
                </p>
              </div>
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Upstash</p>
                <p className="text-sm mt-1">
                  Data storage via Redis (accessed through Vercel KV). All user data, session
                  records, and settings are stored here.
                  <br />
                  <a href="https://upstash.com/trust/privacy" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    upstash.com
                  </a>
                </p>
              </div>
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Google</p>
                <p className="text-sm mt-1">
                  OAuth 2.0 authentication. Google provides your name, email, and profile photo
                  URL when you sign in. Google does not receive your focus session data.
                  <br />
                  <a href="https://policies.google.com/privacy" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    google.com
                  </a>
                </p>
              </div>
              <div className="bg-bg-card border border-surface-900 rounded-lg p-4">
                <p className="text-surface-100 font-medium">Pusher</p>
                <p className="text-sm mt-1">
                  Real-time synchronization between devices, when configured. Pusher processes
                  only transient event data necessary for live updates.
                  <br />
                  <a href="https://pusher.com/legal/privacy-policy" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                    pusher.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* 8. Data Retention */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">8. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Focus session data</strong> is retained indefinitely for as long as your
                account is active, unless you manually delete individual sessions or clear all
                session data through the App.
              </li>
              <li>
                <strong>Account data and settings</strong> are retained for as long as your account
                exists.
              </li>
              <li>
                <strong>Account deletion</strong> &mdash; When you delete your account (available in
                Settings), all of your data, including your profile, sessions, settings, and
                feedback submissions, will be permanently removed from our systems within 30 days.
              </li>
              <li>
                <strong>Audit logs</strong> containing IP addresses are retained for security and
                compliance purposes and are purged in accordance with our internal retention
                schedule.
              </li>
            </ul>
          </section>

          {/* 9. Your Rights Under GDPR */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">9. Your Rights Under GDPR</h2>
            <p>
              If you are located in the European Economic Area or the United Kingdom, you have
              the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>Right of access</strong> &mdash; You may request a copy of the personal data
                we hold about you.
              </li>
              <li>
                <strong>Right to rectification</strong> &mdash; You may request that we correct any
                inaccurate personal data.
              </li>
              <li>
                <strong>Right to erasure</strong> &mdash; You may request that we delete your personal
                data. You can also delete your account directly through Settings.
              </li>
              <li>
                <strong>Right to data portability</strong> &mdash; You may request your data in a
                structured, commonly used, machine-readable format.
              </li>
              <li>
                <strong>Right to restrict processing</strong> &mdash; You may request that we limit
                how we process your personal data under certain circumstances.
              </li>
              <li>
                <strong>Right to object</strong> &mdash; You may object to our processing of your
                personal data where we rely on legitimate interest as the legal basis.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:ashkan.mofidi@gmail.com" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                ashkan.mofidi@gmail.com
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          {/* 10. Your Rights Under CCPA */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">10. Your Rights Under CCPA</h2>
            <p>
              If you are a California resident, the California Consumer Privacy Act (CCPA) grants
              you the following rights:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>
                <strong>Right to know</strong> &mdash; You may request that we disclose the categories
                and specific pieces of personal information we have collected about you, the sources
                of that information, the purposes for collection, and any third parties with whom we
                share it.
              </li>
              <li>
                <strong>Right to delete</strong> &mdash; You may request that we delete the personal
                information we have collected about you. You can also delete your account directly
                through Settings.
              </li>
              <li>
                <strong>Right to correct</strong> &mdash; You may request that we correct inaccurate
                personal information.
              </li>
              <li>
                <strong>Right to opt-out of sale</strong> &mdash; We do not sell your personal
                information to third parties. We have never sold personal information and have no
                plans to do so.
              </li>
              <li>
                <strong>Right to non-discrimination</strong> &mdash; We will not discriminate against
                you for exercising any of your CCPA rights. You will not receive different pricing,
                quality of service, or access to features.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:ashkan.mofidi@gmail.com" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                ashkan.mofidi@gmail.com
              </a>
              . We will verify your identity before processing your request and respond within
              45 days as required by law.
            </p>
          </section>

          {/* 11. Health Data Disclaimer */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">11. Health Data Disclaimer</h2>
            <p>
              Becoming.. is a productivity tool. Focus session metrics (such as session duration,
              frequency, and patterns) are productivity data, not health data. We do not collect,
              process, or store any health, medical, biometric, or wellness information. The App
              is not intended to diagnose, treat, or monitor any health condition.
            </p>
          </section>

          {/* 12. Children's Privacy */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">12. Children&apos;s Privacy</h2>
            <p>
              Becoming.. is not intended for use by anyone under the age of 13. We do not
              knowingly collect personal information from children under 13. If we learn that we
              have collected personal information from a child under 13, we will take steps to
              delete that information promptly. If you believe a child under 13 has provided us
              with personal information, please contact us at{' '}
              <a href="mailto:ashkan.mofidi@gmail.com" className="text-amber-light hover:text-amber-lighter underline underline-offset-2">
                ashkan.mofidi@gmail.com
              </a>
              .
            </p>
          </section>

          {/* 13. International Data Transfers */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">13. International Data Transfers</h2>
            <p>
              All data is stored and processed in the United States. If you access the App from
              outside the United States, your information will be transferred to and processed in
              the United States. By using the App, you consent to this transfer. We ensure that
              our sub-processors maintain appropriate safeguards for international data transfers
              in compliance with applicable data protection laws.
            </p>
          </section>

          {/* 14. Data Breach Notification */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">14. Data Breach Notification</h2>
            <p>
              In the event of a data breach that affects your personal information, we will notify
              affected users via the email address associated with their account within 72 hours
              of becoming aware of the breach, in accordance with GDPR requirements. We will also
              notify relevant supervisory authorities as required by applicable law.
            </p>
          </section>

          {/* 15. Changes to This Policy */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">15. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, technology, legal requirements, or other factors. When we make material
              changes, we will notify you by updating the &quot;Last updated&quot; date at the top
              of this policy and, where appropriate, providing notice within the App. Your
              continued use of the App after changes are posted constitutes your acceptance of the
              updated policy.
            </p>
          </section>

          {/* 16. Contact Us */}
          <section>
            <h2 className="text-surface-100 text-lg font-semibold mb-3">16. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or
              our data practices, you may contact us at:
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
            </p>
          </footer>
        </div>
      </article>
    </main>
  );
}
