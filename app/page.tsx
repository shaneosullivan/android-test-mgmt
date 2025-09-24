import Link from "next/link";
import styles from "./page.module.css";
import { validateConfig } from "@/util/config";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase";

export default function Home() {
  const config = validateConfig();
  if (!config.isValid || !adminDb()) {
    redirect("/config-missing");
  }
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>Simplify Android App Beta Testing</h1>
          <p className={styles.subtitle}>
            Automate Google Group management and promotional code distribution
            for your Android app's beta testing program
          </p>

          <Link href="/register" className={styles.ctaButton}>
            Register Your App Now
          </Link>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>How It Works</h2>

          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <div className={styles.featureNumber}>1</div>
              <div className={styles.featureIcon}>📝</div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>Register Your App</h3>
                <p className={styles.featureDescription}>
                  Add your app details, Google Group, and promotional codes in
                  minutes
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureNumber}>2</div>
              <div className={styles.featureIcon}>👥</div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>Share Signup Link</h3>
                <p className={styles.featureDescription}>
                  Get a custom link to share with potential beta testers
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureNumber}>3</div>
              <div className={styles.featureIcon}>🎟️</div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>
                  Automatic Code Distribution
                </h3>
                <p className={styles.featureDescription}>
                  Promotional codes are automatically assigned to testers as
                  they join
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureNumber}>4</div>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>Track Progress</h3>
                <p className={styles.featureDescription}>
                  Monitor tester signups and code distribution from your admin
                  dashboard
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className={styles.benefits}>
          <h2 className={styles.sectionTitle}>Key Features</h2>

          <div className={styles.benefitsList}>
            <div className={styles.benefit}>
              <span className={styles.checkmark}>✓</span>
              <span>
                Automated Google Group management for Workspace Groups. Also
                works with public groups
              </span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.checkmark}>✓</span>
              <span>Promotional code distribution for paid apps</span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.checkmark}>✓</span>
              <span>
                Just one URL to share for Group sign up and promotional codes
              </span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.checkmark}>✓</span>
              <span>Admin dashboard to track all activity</span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.checkmark}>✓</span>
              <span>CSV upload support for bulk promotional codes</span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.checkmark}>$</span>
              <span>Free!</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.finalCta}>
          <h2 className={styles.ctaTitle}>
            Ready to streamline your beta testing?
          </h2>
          <p className={styles.ctaSubtext}>
            Set up your Android app for beta testing distribution in under 5
            minutes
          </p>

          <Link href="/register" className={styles.ctaButtonSecondary}>
            Get Started Now
          </Link>
        </section>
      </main>
    </div>
  );
}
