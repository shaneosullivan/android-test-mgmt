"use client";

import React from "react";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "google";
  children: React.ReactNode;
  className?: string;
}

function Button(props: ButtonProps) {
  const {
    variant = "primary",
    children,
    className = "",
    ...buttonProps
  } = props;

  const buttonClass = `${styles.button} ${styles[variant]} ${className}`;

  return (
    <button className={buttonClass} {...buttonProps}>
      {children}
    </button>
  );
}

export default Button;
