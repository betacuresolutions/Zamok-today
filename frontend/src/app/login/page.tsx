"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLock, FiMail } from "react-icons/fi";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMethodTabs, type AuthMethod } from "@/components/auth/AuthMethodTabs";
import { AuthShell } from "@/components/auth/AuthShell";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import styles from "@/components/auth/AuthShell.module.css";
import type { AuthUser } from "@/lib/authApi";
import { useT } from "@/i18n/I18nProvider";
import { toast } from "@/lib/toast";
import { useAppDispatch } from "@/store/hooks";
import { clearAuthError, loginUser, phoneLoginSuccess } from "@/store/authSlice";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [method, setMethod] = useState<AuthMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    setSubmitting(true);
    const result = await dispatch(loginUser({ identifier, password, rememberMe }));
    setSubmitting(false);
    if (loginUser.fulfilled.match(result)) {
      toast.success(t("toast.auth.loginSuccess"));
      router.replace("/");
      return;
    }
    const msg =
      result.payload === "ACCOUNT_SUSPENDED"
        ? t("auth.accountSuspended")
        : typeof result.payload === "string"
          ? result.payload
          : t("auth.error.generic");
    toast.error(msg);
  }

  function onPhoneSuccess(user: AuthUser, _meta?: { existingAccount?: boolean }) {
    dispatch(phoneLoginSuccess(user));
    toast.success(t("toast.auth.loginSuccess"));
    router.replace("/");
  }

  return (
    <AuthShell
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link href="/register" className={styles.link}>
            {t("auth.createAccount")}
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
      <AuthMethodTabs value={method} onChange={setMethod} />
      {method === "email" ? (
        <form onSubmit={onSubmit}>
          <AuthField
            id="login-identifier"
            label={t("auth.emailLabel")}
            type="email"
            value={identifier}
            onChange={setIdentifier}
            placeholder={t("auth.emailPlaceholder")}
            icon={FiMail}
            autoComplete="email"
          />
          <AuthField
            id="login-password"
            label={t("auth.passwordLabel")}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            icon={FiLock}
            autoComplete="current-password"
            showToggle
            visible={showPw}
            onToggleVisible={() => setShowPw((v) => !v)}
          />
          <div className={styles.rowBetween}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              {t("auth.rememberMe")}
            </label>
            <Link href="/forgot-password" className={styles.link}>
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? t("auth.pleaseWait") : t("auth.submit.continue")}
          </button>
        </form>
      ) : (
        <PhoneOtpForm purpose="login" onSuccess={onPhoneSuccess} />
      )}
    </AuthShell>
  );
}
