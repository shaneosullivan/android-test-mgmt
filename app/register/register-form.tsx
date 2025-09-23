"use client";

import { useState } from "react";
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
  };
}

function RegisterForm(props: RegisterFormProps) {
  const { session, defaultValues } = props;
  const [groupEmail, setGroupEmail] = useState(defaultValues.googleGroupEmail);
  const [promotionalCodes, setPromotionalCodes] = useState(defaultValues.promotionalCodes);
  const [hasFile, setHasFile] = useState(false);
  const [iconUrl, setIconUrl] = useState("");
  const [showIconInstructions, setShowIconInstructions] = useState(false);

  const isConsumerGroup = groupEmail.endsWith("@googlegroups.com");

  const isValidGooglePlayIconUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is valid (optional field)
    
    // Common Google Play Store icon URL patterns and base64 data URLs
    const patterns = [
      /^https:\/\/play-lh\.googleusercontent\.com\/.*$/,
      /^https:\/\/lh3\.googleusercontent\.com\/.*$/,
      /^data:image\/(png|jpg|jpeg|webp|gif);base64,.*$/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    // Check if both promotional code sources are empty
    const textAreaEmpty = !promotionalCodes.trim();
    const fileEmpty = !hasFile;
    
    if (textAreaEmpty && fileEmpty) {
      e.preventDefault();
      alert("Please provide promotional codes either by entering them in the text area or uploading a CSV file.");
      return;
    }

    // Validate icon URL if provided
    if (iconUrl.trim() && !isValidGooglePlayIconUrl(iconUrl)) {
      e.preventDefault();
      alert("Please enter a valid Google Play Store icon URL. Click 'Show Instructions' to learn how to get the correct URL.");
      return;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasFile(!!e.target.files?.length);
  };

  return (
    <form
      action="/api/apps"
      method="POST"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
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
        />
        {isConsumerGroup && (
          <div className={styles.consumerGroupWarning}>
            <h4>⚠️ Consumer Google Group Detected</h4>
            <p>
              This appears to be a consumer Google Group (
              <code>@googlegroups.com</code>). With consumer groups, testers
              will need to <strong>manually join the group</strong> - they
              cannot be added automatically.
            </p>
            <p>
              <strong>Recommendation:</strong> If you have a Google Workspace
              domain, consider using a group like{" "}
              <code>beta-testers@yourdomain.com</code> instead for full
              automation.
            </p>
            <p>
              <strong>If you continue with this consumer group:</strong> After
              registration, you'll get instructions on how to set up a welcome
              message that includes a direct signup link for testers.
            </p>
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
              <li>Right-click on the app icon and select "Copy image address" or "Copy image URL"</li>
              <li>Paste the URL below</li>
            </ol>
            <p><strong>Note:</strong> The URL should start with <code>https://play-lh.googleusercontent.com/</code> or <code>https://lh3.googleusercontent.com/</code></p>
            <p><em>If left empty, a simple letter-based icon will be shown instead.</em></p>
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
        <textarea
          id="promotionalCodes"
          name="promotionalCodes"
          placeholder="CODE1, CODE2, CODE3"
          rows={4}
          value={promotionalCodes}
          onChange={(e) => setPromotionalCodes(e.target.value)}
        />
        <div className={styles.uploadOption}>
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

      <Button type="submit">Register App</Button>
    </form>
  );
}

export default RegisterForm;
