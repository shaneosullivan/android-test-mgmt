import Link from "next/link";
import styles from "./Header.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <h1 className={styles.title}>Android Beta Testing</h1>
        </Link>
      </div>
    </header>
  );
}

export default Header;
