import styles from "./ErrorBox.module.css";

interface ErrorBoxProps {
  title: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}

function ErrorBox(props: ErrorBoxProps) {
  const { title, message, children, className } = props;

  return (
    <div className={`${styles.error} ${className || ""}`}>
      <p>
        <strong>{title}</strong>
        {message && ` ${message}`}
      </p>
      {children}
    </div>
  );
}

export default ErrorBox;
