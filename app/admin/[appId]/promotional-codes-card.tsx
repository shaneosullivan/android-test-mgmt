"use client";

import { useState } from "react";
import Button from "@/components/Button";
import styles from "./page.module.css";

interface PromotionalCodesCardProps {
  appId: string;
  totalCodes: number;
  availableCodes: number;
  onCodesAdded: () => void;
}

function PromotionalCodesCard(props: PromotionalCodesCardProps) {
  const { appId, totalCodes, availableCodes, onCodesAdded } = props;
  const [promotionalCodes, setPromotionalCodes] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const usedCodes = totalCodes - availableCodes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if both sources are empty
    const textAreaEmpty = !promotionalCodes.trim();
    const fileEmpty = !hasFile;

    if (textAreaEmpty && fileEmpty) {
      setMessage({
        type: "error",
        text: "Please provide promotional codes either by entering them in the text area or uploading a CSV file.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("promotionalCodes", promotionalCodes);

      const fileInput = document.getElementById(
        "promotionalCodesFile"
      ) as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append("promotionalCodesFile", fileInput.files[0]);
      }

      const response = await fetch(`/api/apps/${appId}/codes`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message,
        });
        setPromotionalCodes("");
        setHasFile(false);
        if (fileInput) {
          fileInput.value = "";
        }
        onCodesAdded();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to add promotional codes",
        });
      }
    } catch (error) {
      console.error("Error adding codes:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasFile(!!e.target.files?.length);
    setMessage(null);
  };

  return (
    <section className={styles.section}>
      <h2>Promotional Codes Management</h2>

      <div className={styles.codesStats}>
        <div className={styles.codeStat}>
          <div className={styles.codeStatNumber}>{totalCodes}</div>
          <div className={styles.codeStatLabel}>Total Codes</div>
        </div>
        <div className={styles.codeStat}>
          <div className={styles.codeStatNumber}>{usedCodes}</div>
          <div className={styles.codeStatLabel}>Used Codes</div>
        </div>
        <div className={styles.codeStat}>
          <div className={styles.codeStatNumber}>{availableCodes}</div>
          <div className={styles.codeStatLabel}>Available Codes</div>
        </div>
      </div>

      <div className={styles.addCodesSection}>
        <h3>Add More Promotional Codes</h3>

        {message && (
          <div
            className={
              message.type === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.addCodesForm}>
          <div className={styles.field}>
            <label htmlFor="promotionalCodes">
              Promotional Codes{" "}
              <small>Enter codes manually or upload a CSV file</small>
            </label>
            <textarea
              id="promotionalCodes"
              name="promotionalCodes"
              placeholder="CODE1, CODE2, CODE3"
              rows={4}
              value={promotionalCodes}
              onChange={(e) => {
                setPromotionalCodes(e.target.value);
                setMessage(null);
              }}
              className={styles.textarea}
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

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding Codes..." : "Add Codes"}
          </Button>
        </form>
      </div>
    </section>
  );
}

export default PromotionalCodesCard;
