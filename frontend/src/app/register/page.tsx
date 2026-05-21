"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMethodTabs, type AuthMethod } from "@/components/auth/AuthMethodTabs";
import { AuthShell } from "@/components/auth/AuthShell";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import styles from "@/components/auth/AuthShell.module.css";
import type { AuthUser } from "@/lib/authApi";
import { useT } from "@/i18n/I18nProvider";
import { toast } from "@/lib/toast";
import { useAppDispatch } from "@/store/hooks";
import { clearAuthError, phoneLoginSuccess, registerUser } from "@/store/authSlice";

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [method, setMethod] = useState<AuthMethod>("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    setSubmitting(true);
    const result = await dispatch(registerUser({ fullName, email, password, confirmPassword }));
    setSubmitting(false);
    if (registerUser.fulfilled.match(result)) {
      toast.success(t("toast.auth.registerSuccess"));
      if (result.payload.verifyUrl) {
        sessionStorage.setItem("zamok_dev_verify_url", result.payload.verifyUrl);
        toast.info(t("toast.auth.devVerifyLink"), { duration: 12_000 });
      }
      if (result.payload.mailError) {
        toast.warning(result.payload.mailError);
      }
      router.replace("/verify-email");
      return;
    }
    toast.error(typeof result.payload === "string" ? result.payload : t("auth.error.generic"));
  }

  function onPhoneSuccess(user: AuthUser, meta?: { existingAccount?: boolean }) {
    dispatch(phoneLoginSuccess(user));
    toast.success(
      meta?.existingAccount ? t("toast.auth.loginSuccess") : t("toast.auth.phoneRegisterSuccess")
    );
    router.replace("/");
  }

  return (
    <AuthShell
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className={styles.link}>
            {t("auth.signIn")}
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
            id="reg-full-name"
            label={t("auth.fullNameLabel")}
            value={fullName}
            onChange={setFullName}
            placeholder={t("auth.fullNamePlaceholder")}
            icon={FiUser}
            autoComplete="name"
          />
          <AuthField
            id="reg-email"
            label={t("auth.emailLabel")}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t("auth.emailPlaceholder")}
            icon={FiMail}
            autoComplete="email"
          />
          <AuthField
            id="reg-password"
            label={t("auth.passwordLabel")}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            icon={FiLock}
            autoComplete="new-password"
            showToggle
            visible={showPw}
            onToggleVisible={() => setShowPw((v) => !v)}
          />
          <AuthField
            id="reg-confirm"
            label={t("auth.confirmPasswordLabel")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            icon={FiLock}
            autoComplete="new-password"
            showToggle
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm((v) => !v)}
          />
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? t("auth.pleaseWait") : t("auth.submit.register")}
          </button>
        </form>
      ) : (
        <>
          <AuthField
            id="reg-phone-full-name"
            label={t("auth.fullNameLabel")}
            value={fullName}
            onChange={setFullName}
            placeholder={t("auth.fullNamePlaceholder")}
            icon={FiUser}
            autoComplete="name"
          />
          <PhoneOtpForm purpose="register" fullName={fullName} onSuccess={onPhoneSuccess} />
        </>
      )}
    </AuthShell>
  );
}
