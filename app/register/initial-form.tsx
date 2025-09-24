"use client";

import { useState } from "react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import Button from "@/components/Button";
import styles from "./page.module.css";

interface InitialFormProps {
  defaultGroupEmail?: string;
}

function InitialForm(props: InitialFormProps) {
  const { defaultGroupEmail = "" } = props;
  const [groupEmail, setGroupEmail] = useState(defaultGroupEmail);
  const [manageAutomatically, setManageAutomatically] = useState(true);

  const isValidEmail =
    groupEmail.trim().includes("@") && groupEmail.trim().includes(".");
  const isConsumerGroup = groupEmail.endsWith("@googlegroups.com");
  const isWorkspaceGroup = isValidEmail && !isConsumerGroup;

  // Determine if we should request admin scopes
  const needsAdminScopes = isWorkspaceGroup && manageAutomatically;

  const getAuthState = () => {
    const params = new URLSearchParams();
    params.set("groupEmail", groupEmail);
    params.set("manageAutomatically", manageAutomatically.toString());
    return `/register?${params.toString()}`;
  };

  return (
    <div className={styles.initialForm}>
      <div className={styles.step}>
        <h2>Step 1: Enter Your Google Group</h2>
        <div className={styles.field}>
          <label htmlFor="groupEmail">Google Group Email</label>
          <input
            id="groupEmail"
            type="email"
            required
            placeholder="beta-testers@googlegroups.com or beta-testers@yourcompany.com"
            value={groupEmail}
            onChange={(e) => setGroupEmail(e.target.value)}
            className={styles.groupEmailInput}
          />
        </div>

        {isConsumerGroup && (
          <div className={styles.consumerGroupInfo}>
            <h4>📧 Consumer Google Group Detected</h4>
            <p>
              This appears to be a consumer Google Group (
              <code>@googlegroups.com</code>). With consumer groups, testers
              will need to manually join the group - they cannot be added
              automatically.
            </p>
            <p>
              <strong>This is perfectly fine!</strong> You'll get instructions
              on how to set up a welcome message that includes a direct signup
              link for testers.
            </p>
          </div>
        )}

        {isWorkspaceGroup && (
          <div className={styles.workspaceGroupOptions}>
            <h4>🏢 Google Workspace Group Detected</h4>
            <p>
              Since this is a Workspace group, you have options for how testers
              join:
            </p>

            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="manageAutomatically"
                  checked={manageAutomatically}
                  onChange={() => setManageAutomatically(true)}
                />
                <div className={styles.radioContent}>
                  <div className={styles.radioTitle}>
                    ✨ <strong>Automatic Management</strong> (Recommended)
                  </div>
                  <div className={styles.radioDescription}>
                    Let this service automatically add testers to your Google
                    Group. This makes onboarding seamless - testers just click a
                    link and they're immediately added to the group.
                  </div>
                  <div className={styles.radioNote}>
                    <strong>Note:</strong> Requires additional Google
                    permissions to manage your group.
                  </div>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="manageAutomatically"
                  checked={!manageAutomatically}
                  onChange={() => setManageAutomatically(false)}
                />
                <div className={styles.radioContent}>
                  <div className={styles.radioTitle}>
                    📝 <strong>Manual Management</strong>
                  </div>
                  <div className={styles.radioDescription}>
                    Testers will need to manually join your Google Group. You'll
                    get instructions on how to set up a welcome message for
                    them.
                  </div>
                  <div className={styles.radioNote}>
                    <strong>Note:</strong> Uses minimal permissions - only basic
                    profile access.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {isValidEmail && (
          <div className={styles.authStep}>
            <h3>Step 2: Sign In with Google</h3>
            <p>
              {needsAdminScopes
                ? "Sign in with the Google account that has admin permissions for this group:"
                : "Sign in with your Google account:"}
            </p>

            <GoogleSignInButton
              returnTo={getAuthState()}
              isConsumerGroup={!needsAdminScopes}
            >
              {needsAdminScopes
                ? "Sign in with Admin Account"
                : "Sign in with Google"}
            </GoogleSignInButton>

            {needsAdminScopes && (
              <div className={styles.permissionNotice}>
                <p>
                  <strong>🔐 Permissions Required:</strong> To automatically
                  manage your Google Group, we need permissions to view and
                  manage group membership. These permissions are only used to
                  add testers to your group.
                </p>
              </div>
            )}
          </div>
        )}

        {!isValidEmail && groupEmail.trim() && (
          <div className={styles.invalidEmailNotice}>
            <p>Please enter a valid email address for your Google Group.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InitialForm;
