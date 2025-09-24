"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@/util/auth";
import Button from "@/components/Button";
import styles from "./page.module.css";

interface RegisterFormProps {
  session: UserSession | null;
  defaultValues: {
    appName: string;
    googleGroupEmail: string;
    playStoreUrl: string;
    promotionalCodes: string;
    iconUrl: string;
    manageAutomatically: boolean;
  };
}

function RegisterForm(props: RegisterFormProps) {
  const { session, defaultValues } = props;
  const [groupEmail, setGroupEmail] = useState(defaultValues.googleGroupEmail);
  const [promotionalCodes, setPromotionalCodes] = useState(
    defaultValues.promotionalCodes
  );
  const [hasFile, setHasFile] = useState(false);
  const [iconUrl, setIconUrl] = useState(defaultValues.iconUrl);
  const [showIconInstructions, setShowIconInstructions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupValidation, setGroupValidation] = useState<{
    isValidating: boolean;
    canManage?: boolean;
    allowsExternalMembers?: boolean;
    error?: string;
    errorType?: string;
  }>({ isValidating: false });
  const [showExternalUserModal, setShowExternalUserModal] = useState(false);

  const isConsumerGroup = groupEmail.endsWith("@googlegroups.com");
  const isWorkspaceGroup =
    !isConsumerGroup &&
    groupEmail.includes("@") &&
    !groupEmail.endsWith("@googlegroups.com");

  // Use the user's preference to determine if we should show workspace features
  const shouldShowWorkspaceFeatures =
    isWorkspaceGroup && defaultValues.manageAutomatically;

  const isValidGooglePlayIconUrl = (url: string): boolean => {
    if (!url.trim()) {
      return true; // Empty URL is valid (optional field)
    }

    // Common Google Play Store icon URL patterns and base64 data URLs
    const patterns = [
      /^https:\/\/play-lh\.googleusercontent\.com\/.*$/,
      /^https:\/\/lh3\.googleusercontent\.com\/.*$/,
      /^data:image\/(png|jpg|jpeg|webp|gif);base64,.*$/,
    ];

    return patterns.some((pattern) => pattern.test(url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    // Prevent double submission
    if (isSubmitting) {
      e.preventDefault();
      return;
    }

    // Check if both promotional code sources are empty
    const textAreaEmpty = !promotionalCodes.trim();
    const fileEmpty = !hasFile;

    if (textAreaEmpty && fileEmpty) {
      const shouldContinue = confirm(
        "No promotional codes were provided. Your app will be registered without any promotional codes, and testers will join your beta testing without receiving codes. Do you want to continue?"
      );
      if (!shouldContinue) {
        e.preventDefault();
        return;
      }
      // User confirmed, continue with form submission
    }

    // Validate icon URL if provided
    if (iconUrl.trim() && !isValidGooglePlayIconUrl(iconUrl)) {
      e.preventDefault();
      alert(
        "Please enter a valid Google Play Store icon URL. Click 'Show Instructions' to learn how to get the correct URL."
      );
      return;
    }

    // Set submitting state to prevent double submission
    setIsSubmitting(true);

    // Form will continue to submit naturally
    // Note: If validation fails above, isSubmitting remains false
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasFile(!!e.target.files?.length);
  };

  const validateGoogleGroup = async (email: string) => {
    if (!session || !shouldShowWorkspaceFeatures || !email.trim()) {
      setGroupValidation({ isValidating: false });
      return;
    }

    setGroupValidation({ isValidating: true });

    try {
      const response = await fetch("/api/groups/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupEmail: email }),
      });

      const result = await response.json();

      setGroupValidation({
        isValidating: false,
        canManage: result.canManage,
        allowsExternalMembers: result.allowsExternalMembers,
        error: result.error,
        errorType: result.errorType,
      });
    } catch (error) {
      console.error("Group validation error:", error);
      setGroupValidation({
        isValidating: false,
        error: "Network error occurred while validating group permissions.",
        errorType: "NETWORK_ERROR",
      });
    }
  };

  const handleGroupEmailBlur = () => {
    validateGoogleGroup(groupEmail);
  };

  // Validate group email on component mount if it's prepopulated
  useEffect(() => {
    if (groupEmail && groupEmail.trim()) {
      validateGoogleGroup(groupEmail);
    }
  }, [session, shouldShowWorkspaceFeatures]); // Re-run if session or workspace features change

  return (
    <form
      action="/api/apps"
      method="POST"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
      className={
        (session ? styles.form : `${styles.form} ${styles.formDisabled}`) +
        ` ${styles.bareForm}`
      }
    >
      {/* Hidden field to preserve the management preference */}
      <input
        type="hidden"
        name="manageAutomatically"
        value={defaultValues.manageAutomatically.toString()}
      />

      <div className={styles.field}>
        <label htmlFor="appName">App Name</label>
        <input
          id="appName"
          name="appName"
          type="text"
          required
          placeholder="My Awesome App"
          defaultValue={defaultValues.appName}
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
          value={groupEmail}
          onChange={(e) => setGroupEmail(e.target.value)}
          onBlur={handleGroupEmailBlur}
        />
        {(isConsumerGroup || !defaultValues.manageAutomatically) && (
          <div className={styles.consumerGroupWarning}>
            <h4>📝 Manual Group Management</h4>
            <p>
              {isConsumerGroup
                ? "With consumer Google Groups (@googlegroups.com), testers will need to manually join the group - they cannot be added automatically."
                : "You've chosen manual group management. Testers will need to manually join your Google Group."}
            </p>
            <p>
              <strong>How it works:</strong> After registration, you'll get
              instructions on how to set up a welcome message that includes a
              direct signup link for testers.
            </p>
          </div>
        )}

        {/* Group validation feedback for automatically managed Workspace groups */}
        {shouldShowWorkspaceFeatures && session && (
          <div className={styles.groupValidation}>
            {groupValidation.isValidating && (
              <div className={styles.validationSpinner}>
                <div className={styles.spinner}></div>
                <span>Checking group permissions...</span>
              </div>
            )}

            {!groupValidation.isValidating && groupValidation.error && (
              <div className={styles.validationError}>
                <h4>❌ Permission Issue</h4>
                <p>{groupValidation.error}</p>
                {groupValidation.errorType === "ACCESS_DENIED" && (
                  <p>
                    <strong>Solution:</strong> You need to get admin privileges
                    for this Google Group before you can register your app.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => validateGoogleGroup(groupEmail)}
                  className={styles.revalidateButton}
                >
                  Revalidate
                </button>
              </div>
            )}

            {!groupValidation.isValidating &&
              groupValidation.canManage &&
              !groupValidation.error && (
                <div className={styles.validationSuccess}>
                  <h4>✅ Permission Verified</h4>
                  <p>You can manage this Google Group.</p>
                  {groupValidation.allowsExternalMembers && (
                    <p>
                      <strong>✅ External users are allowed</strong> - Anyone
                      with the link can join your beta testing.
                    </p>
                  )}
                  {!groupValidation.allowsExternalMembers && (
                    <div className={styles.externalMemberWarning}>
                      <p>
                        <strong>⚠️ External Members Not Allowed:</strong> This
                        group is currently configured to not allow external
                        members, only members from your Google Workspace domain
                        can join.
                      </p>
                      <p>
                        For your beta testing to work with external users,
                        you'll need to enable external members for this group
                        using the instructions below:
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowExternalUserModal(true)}
                        className={styles.helpButton}
                      >
                        Show me how to enable external users
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="playStoreUrl">Play Store URL</label>
        <input
          id="playStoreUrl"
          name="playStoreUrl"
          type="url"
          required
          placeholder="https://play.google.com/store/apps/details?id=com.example.app"
          defaultValue={defaultValues.playStoreUrl}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="iconUrl">
          App Icon URL (optional){" "}
          <button
            type="button"
            onClick={() => setShowIconInstructions(!showIconInstructions)}
            className={styles.instructionToggle}
          >
            {showIconInstructions ? "Hide Instructions" : "Show Instructions"}
          </button>
        </label>

        {showIconInstructions && (
          <div className={styles.instructionsBox}>
            <h4>How to get your app's icon URL:</h4>
            <ol>
              <li>Go to your app's Google Play Store page</li>
              <li>
                Right-click on the app icon and select "Copy image address" or
                "Copy image URL"
              </li>
              <li>Paste the URL below</li>
            </ol>
            <p>
              <strong>Note:</strong> The URL should start with{" "}
              <code>https://play-lh.googleusercontent.com/</code> or{" "}
              <code>https://lh3.googleusercontent.com/</code>
            </p>
            <p>
              <em>
                If left empty, a simple letter-based icon will be shown instead.
              </em>
            </p>
          </div>
        )}

        <input
          id="iconUrl"
          name="iconUrl"
          type="url"
          placeholder="https://play-lh.googleusercontent.com/..."
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="promotionalCodes">
          Promotional Codes (optional){" "}
          <small>Enter codes manually or upload a CSV file</small>
        </label>
        <div className={styles.uploadOption}>
          <textarea
            id="promotionalCodes"
            name="promotionalCodes"
            placeholder="CODE1, CODE2, CODE3"
            rows={4}
            value={promotionalCodes}
            onChange={(e) => setPromotionalCodes(e.target.value)}
          />
          <div className={styles.uploadFileOption}>
            <span className={styles.uploadLabel}>Or upload CSV file:</span>
            <input
              type="file"
              id="promotionalCodesFile"
              name="promotionalCodesFile"
              accept=".csv"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={!session || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Register App"}
      </Button>

      {/* Modal for external user instructions */}
      {showExternalUserModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowExternalUserModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                Check and Enable External Users for Google Workspace Groups
              </h3>
              <button
                type="button"
                onClick={() => setShowExternalUserModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <p>
                To check and enable external users for your Google Workspace
                group:
              </p>
              <ol>
                <li>
                  Go to{" "}
                  <a
                    href="https://admin.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Admin Console
                  </a>
                </li>
                <li>
                  Navigate to <strong>Groups</strong> in the left sidebar
                </li>
                <li>
                  Find and click on your group: <code>{groupEmail}</code>
                </li>
                <li>
                  Click on <strong>Access settings</strong>
                </li>
                <li>
                  Under <strong>"Who can join the group"</strong>, select:
                  <ul>
                    <li>
                      <strong>"Anyone on the web"</strong> - for completely open
                      groups
                    </li>
                    <li>
                      <strong>"Anyone can ask"</strong> - for moderated external
                      access
                    </li>
                  </ul>
                </li>
                <li>
                  Under <strong>"Allow external members"</strong>, ensure that
                  you have selected <strong>"ON"</strong>. If this is not
                  allowed, you need to enable it in the main Admin settings
                  first, or contact the admin of your Google Workspace domain to
                  enable the setting. Tell then:
                  <ul>
                    <li>
                      Go to{" "}
                      <strong>
                        Apps &gt; Google Workspace &gt; Groups for Business
                      </strong>
                    </li>
                    <li>
                      Click on <strong>Sharing settings</strong>
                    </li>
                    <li>
                      Ensure{" "}
                      <strong>"Group owners can allow external members"</strong>{" "}
                      is checked
                    </li>
                  </ul>
                </li>
                <li>
                  Click <strong>Save</strong>
                </li>
              </ol>
              <div className={styles.modalNote}>
                <p>
                  <strong>Note:</strong> These settings require Google Workspace
                  admin privileges. If you don't have admin access, contact your
                  IT administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default RegisterForm;
