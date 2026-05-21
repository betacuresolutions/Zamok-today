"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMail } from "react-icons/fi";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import styles from "@/components/auth/AuthShell.module.css";
import { authForgotPassword } from "@/lib/authApi";
import { useT } from "@/i18n/I18nProvider";
import { toast } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetUrl(null);
    setSubmitting(true);
    try {
      const res = await authForgotPassword(email);
      toast.success(res.message || t("toast.auth.passwordResetSent"));
      if (res.resetUrl) {
        setResetUrl(res.resetUrl);
        toast.info(t("toast.auth.devResetLink"), { duration: 12_000 });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      subtitle={t("auth.forgot.subtitle")}
      footer={
        <>
          <Link href="/login" className={styles.link}>
            {t("auth.backToLogin")}
          </Link>
          <span className={styles.footerSep} aria-hidden>
            ·
          </span>
          <Link href="/" className={styles.link}>
            {t("auth.backToHome") === "auth.backToHome" ? t("nav.home") : t("auth.backToHome")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        {resetUrl ? (
          <div className={styles.devReset}>
            <p className={styles.devResetLabel}>{t("auth.forgot.devLink")}</p>
            <a href={resetUrl} className={styles.devResetLink}>
              {resetUrl}
            </a>
          </div>
        ) : null}
        <AuthField
          id="forgot-email"
          label={t("auth.emailLabel")}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t("auth.emailPlaceholder")}
          icon={FiMail}
          autoComplete="email"
        />
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? t("auth.pleaseWait") : t("auth.submit.sendReset")}
        </button>
      </form>
    </AuthShell>
  );
}
