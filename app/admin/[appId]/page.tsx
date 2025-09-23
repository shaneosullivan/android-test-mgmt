import {
  getApp,
  getTestersForApp,
  getPromotionalCodesForApp,
} from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";
import { APP_URL_BASE } from "@/lib/consts";
import CopyButton from "./copy-button";
import LoginPrompt from "./login-prompt";
import ErrorBox from "@/components/ErrorBox";
import AppIcon from "@/components/AppIcon";
import styles from "./page.module.css";

interface AdminPageProps {
  params: Promise<{ appId: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const resolvedParams = await params;
  const { appId } = resolvedParams;

  // Check if user is authenticated
  const session = await getSessionFromCookie();

  if (!session) {
    return <LoginPrompt appId={appId} />;
  }

  try {
    const [app, testers, promotionalCodes] = await Promise.all([
      getApp(appId),
      getTestersForApp(appId),
      getPromotionalCodesForApp(appId),
    ]);

    if (!app) {
      return (
        <div className={styles.container}>
          <ErrorBox title="App not found" />
        </div>
      );
    }

    if (!app.isSetupComplete) {
      return (
        <div className={styles.container}>
          <ErrorBox
            title="App Setup Incomplete"
            message="This app registration was not completed successfully. Please try registering your app again."
          >
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <a
                href="/register"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                Register App Again
              </a>
            </div>
          </ErrorBox>
        </div>
      );
    }

    const signupUrl = `${APP_URL_BASE}/signup/${appId}`;
    const isConsumerGroup = app.googleGroupEmail.endsWith("@googlegroups.com");
    const completeUrl = `${APP_URL_BASE}/signup/${appId}/complete?s=${app.appIdSecret}`;
    const groupName = app.googleGroupEmail.split("@")[0];

    // Calculate statistics
    const redeemedCodes = promotionalCodes.filter((code) => code.redeemedAt);
    const stats = {
      totalTesters: testers.length,
      joinedGroup: testers.filter((t) => t.hasJoinedGroup).length,
      codesAssigned: testers.filter((t) => t.promotionalCode).length,
      availableCodes: promotionalCodes.length - redeemedCodes.length,
    };

    console.log("testers", testers);

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.appIconContainer}>
            <AppIcon appName={app.appName} iconUrl={app.iconUrl} size={80} />
          </div>
          <div className={styles.headerContent}>
            <h1>{app.appName} - Admin</h1>
            <p>Manage your beta testing distribution</p>
          </div>
        </header>

        <section className={styles.section}>
          <h2>App Details</h2>
          <div className={styles.details}>
            <div className={styles.detail}>
              <strong>Google Group:</strong> {app.googleGroupEmail}
            </div>
            <div className={styles.detail}>
              <strong>Play Store URL:</strong>{" "}
              <a
                href={app.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {app.playStoreUrl}
              </a>
            </div>
            <div className={styles.detail}>
              <strong>Total Promotional Codes:</strong>{" "}
              {promotionalCodes.length}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Statistics</h2>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{stats.totalTesters}</div>
              <div className={styles.statLabel}>Total Testers</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{stats.joinedGroup}</div>
              <div className={styles.statLabel}>Joined Group</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{stats.codesAssigned}</div>
              <div className={styles.statLabel}>Codes Assigned</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{stats.availableCodes}</div>
              <div className={styles.statLabel}>Codes Available</div>
            </div>
          </div>
        </section>

        {isConsumerGroup && (
          <section className={styles.section}>
            <h2>🔧 Consumer Group Setup Required</h2>
            <p>
              Since you're using a consumer Google Group (
              <code>{app.googleGroupEmail}</code>), you need to add a welcome
              message to allow automated signup.
            </p>
            <div className={styles.instructions}>
              <h3>Setup Instructions:</h3>
              <ol>
                <li>
                  Go to your Google Group settings:
                  <a
                    href={`https://groups.google.com/g/${groupName}/settings`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.setupLink}
                  >
                    https://groups.google.com/g/{groupName}/settings
                  </a>
                </li>
                <li>
                  Add this text to your "Welcome message":
                  <div className={styles.welcomeMessage}>
                    To install the app for free using a promotion code, click
                    this link {completeUrl}
                  </div>
                  <CopyButton
                    url={`To install the app for free using a promotion code, click this link ${completeUrl}`}
                  />
                </li>
                <li>Save the settings</li>
              </ol>
              <p>
                <strong>How it works:</strong> When testers join your Google
                Group manually, they'll receive this welcome message with a
                direct link to get their promotional code.
              </p>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2>Sign-up Link</h2>
          <p>Share this link with potential testers:</p>
          <div className={styles.urlContainer}>
            <input
              type="text"
              value={signupUrl}
              readOnly
              className={styles.urlInput}
            />
            <CopyButton url={signupUrl} />
          </div>
        </section>

        <section className={styles.section}>
          <h2>Testers ({testers.length})</h2>
          {testers.length === 0 ? (
            <p>No testers have signed up yet.</p>
          ) : (
            <div className={styles.testersTable}>
              <div className={styles.tableHeader}>
                <div>Email</div>
                <div>Joined Group</div>
                <div>Promotional Code</div>
                <div>Joined At</div>
              </div>
              {testers.map((tester) => (
                <div key={tester.id} className={styles.tableRow}>
                  <div data-label="Email">{tester.email}</div>
                  <div
                    data-label="Joined Group"
                    className={tester.hasJoinedGroup ? styles.yes : styles.no}
                  >
                    {tester.hasJoinedGroup ? "Yes" : "No"}
                  </div>
                  <div data-label="Promotional Code">
                    {tester.promotionalCode || "-"}
                  </div>
                  <div data-label="Joined At">
                    {tester.joinedAt instanceof Date
                      ? tester.joinedAt.toLocaleDateString()
                      : new Date(tester.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    console.error("Admin page error:", error);

    return (
      <div className={styles.container}>
        <ErrorBox
          title="App Not Found"
          message={`The app "${appId}" could not be found. This might be because it hasn't been registered yet, or the URL is incorrect.`}
        >
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <a
              href="/register"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#16a34a",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "500",
                marginBottom: "16px",
              }}
            >
              Register Your App
            </a>
            <p style={{ margin: "8px 0", color: "#6b7280", fontSize: "14px" }}>
              or{" "}
              <a
                href="/"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                return to homepage
              </a>
            </p>
          </div>
        </ErrorBox>
      </div>
    );
  }
}
