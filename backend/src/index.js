import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { seedSuperAdmin } from "./services/seedSuperAdmin.js";
import { ensureUserAuthIndexes } from "./services/ensureUserIndexes.js";

const PORT = Number(process.env.PORT || 4000);
const RAW_MONGODB_URI = String(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zamok_today").trim();
const MONGODB_URI = RAW_MONGODB_URI.replace(/^=+/, "").replace(/^['"]|['"]$/g, "");

/**
 * Windows often fails querySrv with system DNS while Compass still works.
 * For mongodb+srv, use public resolvers unless DNS_SERVERS overrides (comma-separated).
 * Set DNS_SERVERS= to empty string to keep system default only.
 */
function configureDnsForSrv(uri) {
  if (!uri.startsWith("mongodb+srv://")) return;
  const raw = process.env.DNS_SERVERS;
  const servers =
    raw === undefined
      ? ["8.8.8.8", "1.1.1.1"]
      : raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (servers.length) dns.setServers(servers);
}

configureDnsForSrv(MONGODB_URI);
dns.setDefaultResultOrder("ipv4first");

async function start() {
  if (!/^mongodb(\+srv)?:\/\//i.test(MONGODB_URI)) {
    throw new Error('Invalid MONGODB_URI in .env. It must start with "mongodb://" or "mongodb+srv://".');
  }
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15_000,
    family: 4
  });
  await ensureUserAuthIndexes();
  await seedSuperAdmin();

  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  if (err?.code === "ECONNREFUSED" && err?.syscall === "querySrv") {
    // eslint-disable-next-line no-console
    console.error(`
    MongoDB: SRV DNS lookup failed from Node.js (MongoDB Compass can still work — it uses a different resolver).

    Try one of these:
      • This app already uses Google/Cloudflare DNS for mongodb+srv (override with DNS_SERVERS in .env).
        If it still fails, set DNS_SERVERS=208.67.222.222,208.67.220.220 or your ISP’s DNS.
      • Atlas → Connect → Drivers → use the STANDARD URI (mongodb://host:27017,...) instead of mongodb+srv://
      • Windows: set adapter DNS to 1.1.1.1 / 8.8.8.8, then: ipconfig /flushdns
      • Disable VPN / try another network
    `);
  }
  process.exitCode = 1;
});
