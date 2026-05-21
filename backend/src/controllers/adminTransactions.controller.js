import { parsePhoneNumberFromString } from "libphonenumber-js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { parseDataTablesRequest } from "../utils/dataTablesRequest.js";
import { PRIMARY_WALLET_CURRENCY } from "../config/wallet.js";

const SORTABLE_FIELDS = new Set([
  "createdAt",
  "amount",
  "status",
  "type",
  "description",
  "userFullName",
  "userEmail",
  "userContact"
]);

const SORT_FIELD_MAP = {
  createdAt: "createdAt",
  amount: "amount",
  status: "status",
  type: "type",
  description: "description",
  userFullName: "user.fullName",
  userEmail: "userContactSort",
  userContact: "userContactSort"
};

function formatPhoneDisplay(digits) {
  const d = String(digits || "").replace(/\D/g, "");
  if (!d) return "";
  try {
    const parsed = parsePhoneNumberFromString(`+${d}`);
    if (parsed?.isValid()) return parsed.formatInternational();
  } catch {
    // fall through
  }
  return `+${d}`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function readQueryParam(req, key) {
  const source = { ...req.query, ...req.body };
  return String(source[key] ?? "").trim();
}

/** Parse HTML date inputs (YYYY-MM-DD) into UTC day bounds for `createdAt`. */
function parsePeriodBounds(req) {
  const fromStr = readQueryParam(req, "dateFrom");
  const toStr = readQueryParam(req, "dateTo");

  let from = null;
  let to = null;

  if (DATE_ONLY_RE.test(fromStr)) {
    from = new Date(`${fromStr}T00:00:00.000Z`);
    if (Number.isNaN(from.getTime())) from = null;
  }
  if (DATE_ONLY_RE.test(toStr)) {
    to = new Date(`${toStr}T23:59:59.999Z`);
    if (Number.isNaN(to.getTime())) to = null;
  }

  if (from && to && from > to) {
    return { from: to, to: from };
  }

  return { from, to };
}

function buildCreatedAtMatch(from, to) {
  if (!from && !to) return null;
  const createdAt = {};
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  return { createdAt };
}

function lookupStages() {
  return [
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        userContactSort: {
          $let: {
            vars: { email: { $ifNull: ["$user.email", ""] } },
            in: {
              $cond: [
                { $gt: [{ $strLenCP: "$$email" }, 0] },
                { $toLower: "$$email" },
                { $toLower: { $ifNull: ["$user.phone", ""] } }
              ]
            }
          }
        }
      }
    }
  ];
}

function buildSearchMatch(searchValue) {
  const re = new RegExp(escapeRegex(searchValue), "i");
  const amountStr = escapeRegex(searchValue);
  return {
    $or: [
      { description: re },
      { type: re },
      { status: re },
      { cardLast4: re },
      { paymentMethod: re },
      { "user.fullName": re },
      { "user.email": re },
      { "user.phone": re },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$amount" },
            regex: amountStr,
            options: "i"
          }
        }
      }
    ]
  };
}

function formatAmount(amount, currency) {
  const value = Number(amount) || 0;
  const code = String(currency || PRIMARY_WALLET_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

function transactionToRow(doc) {
  const user = doc.user || {};
  const currency = String(doc.currency || PRIMARY_WALLET_CURRENCY).toUpperCase();
  const description = String(doc.description || "").trim() || "Wallet top-up";
  const cardLast4 = String(doc.cardLast4 || "").trim();
  const userEmail = String(user.email || "").trim();
  const userPhone = String(user.phone || "").trim();
  const userPhoneDisplay = formatPhoneDisplay(userPhone);
  const userContact = userEmail || userPhoneDisplay || "";

  return {
    id: String(doc._id),
    userId: doc.userId ? String(doc.userId) : "",
    userFullName: String(user.fullName || "").trim(),
    userEmail,
    userPhone,
    userPhoneDisplay,
    userContact,
    type: doc.type || "top_up",
    description,
    descriptionDisplay: cardLast4 ? `${description} · •••• ${cardLast4}` : description,
    amount: Number(doc.amount) || 0,
    amountDisplay: formatAmount(doc.amount, currency),
    currency,
    status: doc.status || "completed",
    cardLast4,
    paymentMethod: doc.paymentMethod || "card",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    createdAtDisplay: doc.createdAt
      ? new Date(doc.createdAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short"
        })
      : ""
  };
}

/**
 * DataTables server-side processing for wallet transactions.
 */
export async function listTransactionsDataTable(req, res) {
  try {
    const { draw, start, length, searchValue, orderDir, columnData } =
      parseDataTablesRequest(req);

    const { from: dateFrom, to: dateTo } = parsePeriodBounds(req);
    const dateMatch = buildCreatedAtMatch(dateFrom, dateTo);

    const sortField = SORTABLE_FIELDS.has(columnData) ? columnData : "createdAt";
    const mongoSortKey = SORT_FIELD_MAP[sortField] || "createdAt";
    const mongoSortDir = orderDir === "asc" ? 1 : -1;

    const recordsTotal = await WalletTransaction.countDocuments();

    let recordsFiltered = recordsTotal;
    if (dateMatch || searchValue) {
      if (dateMatch && !searchValue) {
        recordsFiltered = await WalletTransaction.countDocuments(dateMatch);
      } else {
        const countResult = await WalletTransaction.aggregate([
          ...(dateMatch ? [{ $match: dateMatch }] : []),
          ...lookupStages(),
          ...(searchValue ? [{ $match: buildSearchMatch(searchValue) }] : []),
          { $count: "count" }
        ]);
        recordsFiltered = countResult[0]?.count ?? 0;
      }
    }

    const pipeline = [
      ...(dateMatch ? [{ $match: dateMatch }] : []),
      ...lookupStages(),
      ...(searchValue ? [{ $match: buildSearchMatch(searchValue) }] : []),
      { $sort: { [mongoSortKey]: mongoSortDir } },
      { $skip: start },
      { $limit: length }
    ];

    const docs = await WalletTransaction.aggregate(pipeline);

    return res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data: docs.map(transactionToRow)
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[admin] list transactions:", err?.message || err);
    return res.status(500).json({ error: "Could not load transactions" });
  }
}
