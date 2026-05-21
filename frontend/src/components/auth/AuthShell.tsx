"use client";

import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { useT } from "@/i18n/I18nProvider";
import styles from "./AuthShell.module.css";

export function AuthShell({
  children,
  subtitle,
  footer,
  showBackHome = true
}: {
  children: React.ReactNode;
  subtitle?: string;
  footer?: React.ReactNode;
  showBackHome?: boolean;
}) {
  const t = useT();
  const backHomeLabel = (() => {
    const v = t("auth.backToHome");
    return v === "auth.backToHome" ? t("nav.home") : v;
  })();

  return (
    <div className={styles.page}>
      {showBackHome ? (
        <Link href="/" className={styles.backHome}>
          <FiArrowLeft className={styles.backHomeIcon} aria-hidden />
          {backHomeLabel}
        </Link>
      ) : null}
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Link href="/" className={styles.logoLink} aria-label="Zamok Today">
            <Image
              src="/logo.png"
              alt=""
              width={80}
              height={80}
              className={styles.logoImg}
              priority
            />
          </Link>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
