"use client";

import { useState } from "react";
import styles from "./PromotionalCodeDisplay.module.css";

interface PromotionalCodeDisplayProps {
  code: string;
  title?: string;
  description?: string;
  showCopyButton?: boolean;
  className?: string;
}

function PromotionalCodeDisplay(props: PromotionalCodeDisplayProps) {
  const {
    code,
    title = "Your Promotional Code",
    description = "Use this code to get the app for free on the Play Store.",
    showCopyButton = true,
    className,
  } = props;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
      // Fallback: select the text
      const codeElement = document.getElementById(`promo-code-${code}`);
      if (codeElement) {
        const range = document.createRange();
        range.selectNodeContents(codeElement);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return (
    <div className={`${styles.codeSection} ${className || ""}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.codeContainer}>
        <div id={`promo-code-${code}`} className={styles.promotionalCode}>
          {code}
        </div>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className={styles.copyButton}
            title="Copy promotional code"
          >
            {copied ? (
              <>
                <CopiedIcon />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon />
                Copy
              </>
            )}
          </button>
        )}
      </div>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
    </svg>
  );
}

function CopiedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
  );
}

export default PromotionalCodeDisplay;
