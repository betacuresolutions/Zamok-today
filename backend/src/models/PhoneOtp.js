import mongoose from "mongoose";

/**
 * Short-lived SMS verification codes (hashed). Not user accounts — users live in User.
 * One active OTP per phone (purpose "auth"); login vs register is decided after verify.
 */
const phoneOtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    purpose: { type: String, required: true, default: "auth", enum: ["auth", "login", "register"] },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    sendCount: { type: Number, default: 1 },
    lastSentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

phoneOtpSchema.index({ phone: 1, purpose: 1 }, { unique: true });
phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PhoneOtp =
  mongoose.models.PhoneOtp || mongoose.model("PhoneOtp", phoneOtpSchema);

export const PHONE_OTP_PURPOSE = "auth";
