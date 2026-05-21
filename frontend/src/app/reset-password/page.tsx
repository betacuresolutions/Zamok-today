"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FiLock } from "react-icons/fi";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import styles from "@/components/auth/AuthShell.module.css";
import { authResetPassword } from "@/lib/authApi";
import { useT } from "@/i18n/I18nProvider";
import { toast } from "@/lib/toast";
import { useAppDispatch } from "@/store/hooks";
import { fetchAuthUser } from "@/store/authSlice";

function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) toast.error(t("auth.reset.missingToken"));
  }, [token, t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error(t("auth.reset.missingToken"));
      return;
    }
    setSubmitting(true);
    try {
      await authResetPassword({ token, password, confirmPassword });
      toast.success(t("toast.auth.passwordUpdated"));
      await dispatch(fetchAuthUser());
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      subtitle={t("auth.reset.subtitle")}
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
        <AuthField
          id="reset-password"
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
          id="reset-confirm"
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
        <button type="submit" className={styles.submit} disabled={submitting || !token}>
          {submitting ? t("auth.pleaseWait") : t("auth.submit.resetPassword")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  const t = useT();
  return (
    <Suspense fallback={<AuthShell>{null}</AuthShell>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
