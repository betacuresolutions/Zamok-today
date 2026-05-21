"use client";

import { useCallback, useMemo, useState } from "react";
import { UsersTableLoadingOverlay } from "@/components/users/UsersTableLoadingOverlay";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import type { Config } from "datatables.net";
import { env } from "@/lib/env";
import {
  fetchDataTablesJson,
  type DataTablesExtraParams,
  type DataTablesServerParams
} from "@/lib/dataTablesAjax";
import { TransactionPeriodRangePicker } from "@/components/transactions/TransactionPeriodRangePicker";
import { useI18n, useT } from "@/i18n/I18nProvider";
import "datatables.net-dt/css/dataTables.dataTables.css";

DataTable.use(DT);

export type AdminTransactionRow = {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  userPhoneDisplay: string;
  userContact: string;
  type: "top_up" | "payment" | "refund";
  description: string;
  descriptionDisplay: string;
  amount: number;
  amountDisplay: string;
  currency: string;
  status: "completed" | "failed" | "pending";
  cardLast4: string;
  paymentMethod: string;
  createdAt: string;
  createdAtDisplay: string;
};

type AppliedPeriod = { from: string; to: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function periodQuery(period: AppliedPeriod): DataTablesExtraParams | undefined {
  const from = period.from.trim();
  const to = period.to.trim();
  if (!from && !to) return undefined;
  const extra: DataTablesExtraParams = {};
  if (from) extra.dateFrom = from;
  if (to) extra.dateTo = to;
  return extra;
}

export function TransactionsDataTable() {
  const { lang } = useI18n();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedPeriod, setAppliedPeriod] = useState<AppliedPeriod>({ from: "", to: "" });
  const [filterRevision, setFilterRevision] = useState(0);

  const labels = useMemo(
    () => ({
      user: t("table.name"),
      contact: t("table.emailOrPhone"),
      type: t("table.type"),
      description: t("table.description"),
      amount: t("table.amount"),
      status: t("table.status"),
      date: t("table.date"),
      period: t("transactions.period.label"),
      periodPlaceholder: t("transactions.period.placeholder"),
      periodApply: t("transactions.period.apply"),
      periodClear: t("transactions.period.clear"),
      periodClose: t("users.wallet.close"),
      typeTopUp: t("transactions.type.top_up"),
      typePayment: t("transactions.type.payment"),
      typeRefund: t("transactions.type.refund"),
      statusCompleted: t("transactions.status.completed"),
      statusFailed: t("transactions.status.failed"),
      statusPending: t("transactions.status.pending"),
      empty: t("transactions.table.empty"),
      noResults: t("transactions.table.noResults"),
      info: t("transactions.table.info"),
      infoEmpty: t("transactions.table.infoEmpty"),
      infoFiltered: t("transactions.table.infoFiltered"),
      search: t("transactions.table.search"),
      lengthMenu: t("transactions.table.lengthMenu"),
      processing: t("transactions.table.processing"),
      dash: "—"
    }),
    [t]
  );

  const applyPeriod = useCallback(() => {
    setAppliedPeriod({ from: dateFrom.trim(), to: dateTo.trim() });
    setFilterRevision((n) => n + 1);
  }, [dateFrom, dateTo]);

  const clearPeriod = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setAppliedPeriod({ from: "", to: "" });
    setFilterRevision((n) => n + 1);
  }, []);

  const columns = useMemo(() => {
    const typeLabel = (type: string) => {
      if (type === "payment") return labels.typePayment;
      if (type === "refund") return labels.typeRefund;
      return labels.typeTopUp;
    };

    const statusLabel = (status: string) => {
      if (status === "failed") return labels.statusFailed;
      if (status === "pending") return labels.statusPending;
      return labels.statusCompleted;
    };

    return [
      {
        data: "userFullName",
        orderable: true,
        className: "font-medium",
        defaultContent: labels.dash,
        render: (data: string) => {
          const v = String(data || "").trim();
          return v ? escapeHtml(v) : labels.dash;
        }
      },
      {
        data: "userContact",
        orderable: true,
        defaultContent: labels.dash,
        render: (data: string, type: string, row: AdminTransactionRow) => {
          const v =
            String(data || "").trim() ||
            row.userEmail?.trim() ||
            row.userPhoneDisplay?.trim() ||
            row.userPhone?.trim();
          if (type !== "display") return v || "";
          return v ? escapeHtml(v) : labels.dash;
        }
      },
      {
        data: "type",
        orderable: true,
        render: (data: string, type: string) => {
          const label = typeLabel(data);
          if (type !== "display") return label;
          return `<span class="zt-dt-pill">${escapeHtml(label)}</span>`;
        }
      },
      {
        data: "description",
        orderable: true,
        render: (_data: string, type: string, row: AdminTransactionRow) => {
          const v = row.descriptionDisplay?.trim() || row.description?.trim();
          if (type !== "display") return v || "";
          return v ? escapeHtml(v) : labels.dash;
        }
      },
      {
        data: "amount",
        orderable: true,
        className: "text-right",
        render: (_amount: number, type: string, row: AdminTransactionRow) => {
          if (type !== "display") return row.amount;
          return row.amountDisplay ? escapeHtml(row.amountDisplay) : labels.dash;
        }
      },
      {
        data: "status",
        orderable: true,
        render: (data: string, type: string) => {
          const label = statusLabel(data);
          if (type !== "display") return label;
          const cls =
            data === "completed"
              ? "zt-dt-badge--ok"
              : data === "failed"
                ? "zt-dt-badge--danger"
                : "zt-dt-badge--warn";
          return `<span class="zt-dt-badge ${cls}">${escapeHtml(label)}</span>`;
        }
      },
      {
        data: "createdAt",
        orderable: true,
        render: (_iso: string, type: string, row: AdminTransactionRow) => {
          if (type !== "display") return row.createdAt;
          return row.createdAtDisplay ? escapeHtml(row.createdAtDisplay) : labels.dash;
        }
      }
    ];
  }, [labels]);

  const periodExtra = useMemo(() => periodQuery(appliedPeriod), [appliedPeriod]);

  const options = useMemo(
    () =>
      ({
        serverSide: true,
        processing: false,
        responsive: false,
        autoWidth: false,
        searching: true,
        ordering: true,
        orderMulti: false,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        searchDelay: 350,
        order: [[6, "desc"]],
        layout: {
          topStart: "pageLength",
          topEnd: "search",
          bottomStart: "info",
          bottomEnd: "paging"
        },
        language: {
          emptyTable: labels.empty,
          zeroRecords: labels.noResults,
          info: labels.info,
          infoEmpty: labels.infoEmpty,
          infoFiltered: labels.infoFiltered,
          search: "",
          searchPlaceholder: labels.search,
          lengthMenu: labels.lengthMenu,
          paginate: {
            first: "«",
            last: "»",
            next: "›",
            previous: "‹"
          }
        },
        ajax: (data: DataTablesServerParams, callback) => {
          const url = `${env.apiBaseUrl}/api/admin/transactions`;
          fetchDataTablesJson<{
            draw: number;
            recordsTotal: number;
            recordsFiltered: number;
            data: AdminTransactionRow[];
          }>(url, data, periodExtra)
            .then((json) => callback(json))
            .catch(() => {
              callback({
                draw: data.draw ?? 1,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
              });
            });
        },
        columns
      }) as Config,
    [columns, labels, periodExtra]
  );

  const hasPeriodFilter = Boolean(appliedPeriod.from || appliedPeriod.to);

  return (
    <div className="zt-datatables-wrap overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/5">
      <div className="zt-tx-period-bar">
        <span className="zt-tx-period-label">{labels.period}</span>
        <TransactionPeriodRangePicker
          value={{ from: dateFrom, to: dateTo }}
          onChange={({ from, to }) => {
            setDateFrom(from);
            setDateTo(to);
          }}
          onApply={applyPeriod}
          onClear={clearPeriod}
          hasAppliedFilter={hasPeriodFilter}
          labels={{
            period: labels.period,
            placeholder: labels.periodPlaceholder,
            apply: labels.periodApply,
            clear: labels.periodClear,
            close: labels.periodClose
          }}
        />
      </div>

      <div className={loading ? "zt-dt-table-host zt-dt-table-host--loading" : "zt-dt-table-host"}>
        {loading ? <UsersTableLoadingOverlay message={labels.processing} /> : null}
        <DataTable
          key={`transactions-dt-${lang}-${filterRevision}`}
          options={options}
          className="display w-full text-sm"
          onProcessing={(_e: unknown, _settings: unknown, show: boolean) => setLoading(Boolean(show))}
          onPreXhr={() => setLoading(true)}
        >
          <thead>
            <tr>
              <th>{labels.user}</th>
              <th>{labels.contact}</th>
              <th>{labels.type}</th>
              <th>{labels.description}</th>
              <th className="text-right">{labels.amount}</th>
              <th>{labels.status}</th>
              <th>{labels.date}</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </div>
  );
}
