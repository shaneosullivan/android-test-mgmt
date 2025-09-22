import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";
import { validateConfig } from "@/util/config";
import AuthButton from "./auth-button";
import styles from "./page.module.css";

export default async function Register() {
  // Check if all required configuration is present
  const config = validateConfig();
  if (!config.isValid || !adminDb) {
    redirect("/config-missing");
  }

  // Check if user is authenticated
  const session = await getSessionFromCookie();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Register Your Android App</h1>
        <p>Set up your app for beta testing distribution</p>

        <div className={styles.disclaimer}>
          <p>
            <strong>Disclaimer:</strong> This service is not affiliated with
            Google. It simply helps you automate the process of managing Google
            Groups for beta testing and distributing promotional codes to your
            testers.
          </p>
        </div>

        <div className={styles.authNotice}>
          <p>
            <strong>🔐 Authentication Required:</strong> Before registering your
            app, you must sign in with the same Google account that administers
            your Google Group. This allows us to verify your permissions and
            manage group membership on your behalf.
          </p>
        </div>

        <AuthButton session={session} />

        <form
          action="/api/apps"
          method="POST"
          encType="multipart/form-data"
          className={
            session ? styles.form : `${styles.form} ${styles.formDisabled}`
          }
        >
          <div className={styles.field}>
            <label htmlFor="appName">App Name</label>
            <input
              id="appName"
              name="appName"
              type="text"
              required
              placeholder="My Awesome App"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="googleGroupEmail">Google Group Email</label>
            <input
              id="googleGroupEmail"
              name="googleGroupEmail"
              type="email"
              required
              placeholder="beta-testers@googlegroups.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="playStoreUrl">Play Store URL</label>
            <input
              id="playStoreUrl"
              name="playStoreUrl"
              type="url"
              required
              placeholder="https://play.google.com/store/apps/details?id=com.example.app"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="promotionalCodes">
              Promotional Codes (optional)
              <small>Enter codes manually or upload a CSV file</small>
            </label>
            <textarea
              id="promotionalCodes"
              name="promotionalCodes"
              placeholder="CODE1, CODE2, CODE3"
              rows={4}
            />
            <div className={styles.uploadOption}>
              <span className={styles.uploadLabel}>Or upload CSV file:</span>
              <input
                type="file"
                id="promotionalCodesFile"
                name="promotionalCodesFile"
                accept=".csv"
                className={styles.fileInput}
              />
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            Register App
          </button>
        </form>
      </main>
    </div>
  );
}
