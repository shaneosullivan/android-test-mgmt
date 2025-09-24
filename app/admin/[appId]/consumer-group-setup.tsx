"use client";

import { useState } from "react";
import CopyButton from "./copy-button";
import styles from "./page.module.css";

interface ConsumerGroupSetupProps {
  googleGroupEmail: string;
  completeUrl: string;
  hasAssignedCodes: boolean;
}

function ConsumerGroupSetup(props: ConsumerGroupSetupProps) {
  const { googleGroupEmail, completeUrl, hasAssignedCodes } = props;
  const [isExpanded, setIsExpanded] = useState(!hasAssignedCodes);

  const groupName = googleGroupEmail.split("@")[0];

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>
          {hasAssignedCodes && (
            <span className={styles.completedCheckmark}>✓</span>
          )}
          🔧 Consumer Group Setup {hasAssignedCodes ? "Completed" : "Required"}
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleButton}
        >
          {isExpanded ? "Hide" : "Show"}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.setupContent}>
          <p>
            Since you're using a consumer Google Group (
            <code>{googleGroupEmail}</code>), you need to add a welcome message
            to allow automated signup.
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
                  To install the app for free using a promotion code, click this
                  link {completeUrl}
                </div>
                <CopyButton
                  url={`To install the app for free using a promotion code, click this link ${completeUrl}`}
                />
              </li>
              <li>Save the settings</li>
            </ol>
            <p>
              <strong>How it works:</strong> When testers join your Google Group
              manually, they'll receive this welcome message with a direct link
              to get their promotional code.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default ConsumerGroupSetup;
