import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo_128.png"
            alt="Android Beta Testing Logo"
            width={32}
            height={32}
            className={styles.logoImage}
          />
          <h1 className={styles.title}>Android Beta Testing</h1>
        </Link>
      </div>
    </header>
  );
}

export default Header;
