import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <Link href="/about" className={styles.link}>
            About
          </Link>
          <a
            href="https://chofter.com/privacy_policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Privacy Policy
          </a>
          <a
            href="https://chofter.com/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Terms & Conditions
          </a>
        </div>
        <div className={styles.copyright}>
          <p>
            © 2024{" "}
            <a
              href="https://chofter.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.authorLink}
            >
              Shane O'Sullivan
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}