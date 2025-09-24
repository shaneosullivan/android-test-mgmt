"use client";

import { useState } from "react";
import { AppData, TesterData, PromotionalCode } from "@/lib/firebase";

// Serialized versions of the Firebase types for client components
type SerializedAppData = Omit<
  AppData,
  "createdAt" | "ownerAccessToken" | "ownerRefreshToken"
> & {
  createdAt: string; // ISO string instead of Date
  // Note: Owner tokens are not sent to client for security
};

type SerializedTesterData = Omit<TesterData, "joinedAt"> & {
  joinedAt: string; // ISO string instead of Date
};

type SerializedPromotionalCode = Omit<
  PromotionalCode,
  "createdAt" | "redeemedAt"
> & {
  createdAt: string; // ISO string instead of Date
  redeemedAt?: string; // ISO string instead of Date
};
import { APP_URL_BASE } from "@/lib/consts";
import CopyButton from "./copy-button";
import AppIcon from "@/components/AppIcon";
import ConsumerGroupSetup from "./consumer-group-setup";
import PromotionalCodesCard from "./promotional-codes-card";
import SignOutButton from "@/components/SignOutButton";
import styles from "./page.module.css";
import StripeDonationButton from "@/components/StripeDonationButton";

interface AdminContentProps {
  appId: string;
  initialApp: SerializedAppData;
  initialTesters: SerializedTesterData[];
  initialPromotionalCodes: SerializedPromotionalCode[];
}

function AdminContent(props: AdminContentProps) {
  const {
    appId,
    initialApp: app,
    initialTesters,
    initialPromotionalCodes,
  } = props;
  const [promotionalCodes, setPromotionalCodes] = useState(
    initialPromotionalCodes
  );
  const [testers] = useState(initialTesters);

  const signupUrl = `${APP_URL_BASE}/signup/${appId}`;
  const isConsumerGroup = app.googleGroupEmail.endsWith("@googlegroups.com");
  const completeUrl = `${APP_URL_BASE}/signup/${appId}/complete?s=${app.appIdSecret}`;

  // Calculate statistics
  const redeemedCodes = promotionalCodes.filter((code) => code.redeemedAt);
  const stats = {
    totalTesters: testers.length,
    joinedGroup: testers.filter((t) => t.hasJoinedGroup).length,
    codesAssigned: testers.filter((t) => t.promotionalCode).length,
    availableCodes: promotionalCodes.length - redeemedCodes.length,
  };

  const handleCodesAdded = async () => {
    // Refetch promotional codes after adding new ones
    try {
      const response = await fetch(`/api/apps/${appId}`);
      if (response.ok) {
        const data = await response.json();
        // Convert Firestore timestamps to ISO strings for serialization
        const serializedCodes = data.promotionalCodes.map((code: any) => ({
          ...code,
          createdAt: code.createdAt.toDate
            ? code.createdAt.toDate().toISOString()
            : code.createdAt,
          redeemedAt: code.redeemedAt
            ? code.redeemedAt.toDate
              ? code.redeemedAt.toDate().toISOString()
              : code.redeemedAt
            : undefined,
        }));
        setPromotionalCodes(serializedCodes);
      }
    } catch (error) {
      console.error("Failed to refetch promotional codes:", error);
    }
  };

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
            <strong>Total Promotional Codes:</strong> {promotionalCodes.length}
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

      <div className={styles.donation}>
        <StripeDonationButton />
      </div>

      <PromotionalCodesCard
        appId={appId}
        totalCodes={promotionalCodes.length}
        availableCodes={stats.availableCodes}
        onCodesAdded={handleCodesAdded}
      />

      {isConsumerGroup && (
        <ConsumerGroupSetup
          googleGroupEmail={app.googleGroupEmail}
          completeUrl={completeUrl}
          hasAssignedCodes={stats.codesAssigned > 0}
        />
      )}

      <section className={styles.section}>
        <h2>Sign-up Link</h2>
        <p>
          Share this link with potential testers
          {isConsumerGroup && stats.codesAssigned === 0 ? (
            <>
              {" "}
              <strong>
                only after setting up your group as explained above
              </strong>
            </>
          ) : null}
          :
        </p>
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
                  {new Date(tester.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.signOutSection}>
        <SignOutButton 
          redirectTo={`/admin/${appId}`}
          variant="secondary"
        />
      </section>
    </div>
  );
}

export default AdminContent;
