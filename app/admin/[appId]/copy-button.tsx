'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface CopyButtonProps {
  url: string;
}

export default function CopyButton(props: CopyButtonProps) {
  const { url } = props;
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  return (
    <button 
      onClick={copyToClipboard}
      className={styles.copyButton}
    >
      {copiedToClipboard ? 'Copied!' : 'Copy'}
    </button>
  );
}