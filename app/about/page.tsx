import Link from "next/link";
import styles from "./page.module.css";

export default function About() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>About Android Beta Testing</h1>
          <p>Learn more about this service and who created it</p>
        </div>

        <div className={styles.section}>
          <h2>About This Service</h2>
          <p>
            Android Beta Testing is a free service that helps Android app
            developers streamline their beta testing process by automating
            Google Group management and promotional code distribution.
          </p>
          <p>
            This tool was created to solve the common pain points developers
            face when managing beta testers, making it easier to distribute
            promotional codes for paid apps and track tester engagement.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Created By</h2>
          <p>
            This service was created by{" "}
            <a
              href="https://chofter.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Shane O'Sullivan
            </a>
            , a software engineer passionate about building tools that help
            developers work more efficiently.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Privacy & Data</h2>
          <p>
            Your privacy is important. This service does not share your data
            with any third parties. All data is stored securely using Firebase
            and is only used to provide the beta testing management
            functionality.
          </p>
          <p>
            The only data collected is what you provide when registering your
            app and what testers provide when signing up for your beta program.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Completely Free</h2>
          <p>
            This service is completely free to use. There are no hidden costs,
            premium features, or subscription fees. It was created as a service
            to the Android development community.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Open Source</h2>
          <p>
            This project is open source and available on GitHub. You can view
            the code, contribute improvements, or even host your own instance.
          </p>
          <p>
            <a
              href="https://github.com/shaneosullivan/android-test-mgmt"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              View on GitHub →
            </a>
          </p>
        </div>

        <div className={styles.footer}>
          <Link href="/" className={styles.homeButton}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
