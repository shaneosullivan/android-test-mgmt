import Link from "next/link";
import styles from "./page.module.css";
import AboutContent from "./AboutContent";

export default function About() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>About Android Beta Testing</h1>
          <p>Learn more about this service and who created it</p>
        </div>

        <AboutContent />

        <div className={styles.footer}>
          <Link href="/" className={styles.homeButton}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
