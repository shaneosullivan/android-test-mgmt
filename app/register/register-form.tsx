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

  const isConsumerGroup = groupEmail.endsWith("@googlegroups.com");

  return (
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
        <label htmlFor="promotionalCodes">
          Promotional Codes (optional){" "}
          <small>Enter codes manually or upload a CSV file</small>
        </label>
        <textarea
          id="promotionalCodes"
          name="promotionalCodes"
          placeholder="CODE1, CODE2, CODE3"
          rows={4}
          defaultValue={defaultValues.promotionalCodes}
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

      <Button type="submit">Register App</Button>
    </form>
  );
}

export default RegisterForm;
