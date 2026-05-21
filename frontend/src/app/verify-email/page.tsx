"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import { AuthShell } from "@/components/auth/AuthShell";
import styles from "@/components/auth/AuthShell.module.css";
import { useT } from "@/i18n/I18nProvider";
import { toast } from "@/lib/toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resendVerificationEmail, verifyEmail } from "@/store/authSlice";

function VerifyEmailContent() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);
  const token = params.get("token") || "";
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("zamok_dev_verify_url");
      if (stored) setDevUrl(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setVerifying(true);
    void dispatch(verifyEmail(token)).then((result) => {
      setVerifying(false);
      if (verifyEmail.fulfilled.match(result)) {
        setVerified(true);
        sessionStorage.removeItem("zamok_dev_verify_url");
        toast.success(t("toast.auth.emailVerified"));
        router.replace("/");
        return;
      }
      toast.error(typeof result.payload === "string" ? result.payload : t("auth.verify.invalidToken"));
    });
  }, [dispatch, router, t, token]);

  async function onResend() {
    setResending(true);
    const result = await dispatch(resendVerificationEmail());
    setResending(false);
    if (resendVerificationEmail.fulfilled.match(result)) {
      toast.success(t("toast.auth.verificationSent"));
      if (result.payload.verifyUrl) {
        setDevUrl(result.payload.verifyUrl);
        sessionStorage.setItem("zamok_dev_verify_url", result.payload.verifyUrl);
        toast.info(t("toast.auth.devVerifyLink"), { duration: 12_000 });
      }
      return;
    }
    toast.error(typeof result.payload === "string" ? result.payload : t("auth.error.generic"));
  }

  if (token && verifying) {
    return (
      <AuthShell subtitle={t("auth.verify.subtitle")}>
        <p className={styles.verifyHint}>{t("auth.verify.checking")}</p>
      </AuthShell>
    );
  }

  if (verified) {
    return (
      <AuthShell subtitle={t("auth.verify.successSubtitle")}>
        <p className={styles.verifySuccess}>
          <FiCheckCircle aria-hidden />
          {t("auth.verify.success")}
        </p>
      </AuthShell>
    );
  }

  const email = user?.email;
  const needsVerify = user?.emailVerified === false;

  return (
    <AuthShell
      subtitle={t("auth.verify.subtitle")}
      footer={
        <>
          <Link href="/" className={styles.link}>
            {t("auth.backToHome") === "auth.backToHome" ? t("nav.home") : t("auth.backToHome")}
          </Link>
          <span className={styles.footerSep} aria-hidden>
            ·
          </span>
          <Link href="/login" className={styles.link}>
            {t("auth.signIn")}
          </Link>
        </>
      }
    >
      <div className={styles.verifyBlock}>
        <div className={styles.verifyIconWrap}>
          <FiMail className={styles.verifyIcon} aria-hidden />
        </div>
        <p className={styles.verifyHint}>
          {email
            ? t("auth.verify.sentTo")
            : status === "authenticated"
              ? t("auth.verify.checkInbox")
              : t("auth.verify.signInHint")}
        </p>
        {email ? <p className={styles.verifyEmail}>{email}</p> : null}
        {devUrl ? (
          <div className={styles.devReset}>
            <p className={styles.devResetLabel}>{t("auth.verify.devLink")}</p>
            <a href={devUrl} className={styles.devResetLink}>
              {devUrl}
            </a>
          </div>
        ) : null}
        {needsVerify || status === "authenticated" ? (
          <button
            type="button"
            className={styles.submit}
            disabled={resending || status !== "authenticated"}
            onClick={() => void onResend()}
          >
            {resending ? t("auth.pleaseWait") : t("auth.verify.resend")}
          </button>
        ) : (
          <Link href="/login" className={styles.submitLink}>
            {t("auth.signIn")}
          </Link>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  const t = useT();
  return (
    <Suspense fallback={<AuthShell>{null}</AuthShell>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
