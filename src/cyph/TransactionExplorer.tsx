import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthContext } from "../ideas/context/AuthContext";

type LedgerPosting = {
  id: string;
  accountId: string;
  amount: string;
  account: {
    id: string;
    accountType: string;
    systemCode: string | null;
    userId: string | null;
  };
};

type LedgerTransaction = {
  id: string;
  type: string;
  idempotencyKey: string;
  actorUserId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  createdAt: string;
  postings: LedgerPosting[];
  fundingGrant: {
    id: string;
    baseAmount: string;
    bonusAmount: string;
    presetCode: string;
    reason: string | null;
  } | null;
};

type Filter = "all" | "received" | "sent";

function formatAmount(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
  }).format(Math.abs(Number(value)));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
}

function shortId(value: string) {
  return value.length > 22 ? `${value.slice(0, 12)}…${value.slice(-6)}` : value;
}

export default function TransactionExplorer() {
  const { user, cyphAccount, authFetch, isAuthenticated, loading: authLoading } = useAuthContext();
  const authFetchRef = useRef(authFetch);
  authFetchRef.current = authFetch;
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !cyphAccount?.id) {
      setTransactions([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    authFetchRef.current("/api/cyph/ledger?limit=100", { method: "GET" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || `Unable to load ledger (${response.status}).`);
        }
        if (!Array.isArray(data?.transactions)) {
          throw new Error("The ledger response was not in the expected format.");
        }
        if (active) setTransactions(data.transactions);
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load transaction history.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cyphAccount?.id, isAuthenticated, refreshKey]);

  const rows = useMemo(() => transactions.map((transaction) => {
    const ownPosting = transaction.postings.find(
      (posting) => posting.accountId === cyphAccount?.id
        || posting.account?.userId === user?.id
    );
    const signedAmount = ownPosting ? Number(ownPosting.amount) : 0;
    return {
      transaction,
      signedAmount,
      direction: signedAmount > 0 ? "received" as const : signedAmount < 0 ? "sent" as const : "other" as const,
    };
  }), [transactions, cyphAccount?.id, user?.id]);

  const visibleRows = rows.filter((row) => filter === "all" || row.direction === filter);

  if (authLoading) {
    return <main style={styles.page}><p>Loading your account…</p></main>;
  }

  if (!isAuthenticated) {
    return (
      <main style={styles.page}>
        <section style={styles.panel}>
          <h1 style={styles.heading}>CYPH transaction history</h1>
          <p>Sign in to view the ledger associated with your account.</p>
          <a href="/cypherVerse" style={styles.linkButton}>Return to CypherVerse</a>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>CYPH ACCOUNT</p>
            <h1 style={styles.heading}>Transaction explorer</h1>
            <p style={styles.muted}>Your account activity, read from the CypherVerse ledger.</p>
          </div>
          <a href="/cypherVerse" style={styles.backLink}>← Back to world</a>
        </header>

        <section style={styles.summary}>
          <div>
            <p style={styles.label}>Available balance</p>
            <strong style={styles.balance}>
              {cyphAccount ? `${formatAmount(cyphAccount.balance)} CYPH` : "No CYPH account"}
            </strong>
          </div>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} style={styles.refreshButton} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh activity"}
          </button>
        </section>

        <section style={styles.panel}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Transactions</h2>
              <p style={styles.muted}>Most recent 100 ledger transactions.</p>
            </div>
            <div style={styles.filters}>
              {(["all", "received", "sent"] as Filter[]).map((value) => (
                <button key={value} type="button" onClick={() => setFilter(value)} style={filter === value ? styles.activeFilter : styles.filter}>
                  {value === "all" ? "All" : value === "received" ? "Received" : "Sent"}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" style={styles.error}>{error}</p>}
          {loading && transactions.length === 0 && <p style={styles.muted}>Loading ledger entries…</p>}
          {!loading && !error && visibleRows.length === 0 && (
            <p style={styles.empty}>No {filter === "all" ? "" : filter + " "}transactions found.</p>
          )}

          <div style={styles.transactionList}>
            {visibleRows.map(({ transaction, signedAmount, direction }) => {
              const expanded = expandedId === transaction.id;
              const title = transaction.fundingGrant
                ? "CYPH funding"
                : transaction.referenceType
                  ? transaction.referenceType.replace(/_/g, " ")
                  : transaction.type.replace(/_/g, " ");
              return (
                <article key={transaction.id} style={styles.transaction}>
                  <button type="button" onClick={() => setExpandedId(expanded ? null : transaction.id)} style={styles.transactionButton} aria-expanded={expanded}>
                    <span style={styles.directionMark}>{direction === "received" ? "↓" : direction === "sent" ? "↑" : "•"}</span>
                    <span style={styles.transactionMain}>
                      <strong style={styles.transactionTitle}>{title}</strong>
                      <span style={styles.muted}>{transaction.reason || transaction.type} · {formatDate(transaction.createdAt)}</span>
                      <span style={styles.idText}>ID: {shortId(transaction.id)}</span>
                    </span>
                    <span style={styles.amountColumn}>
                      <strong style={signedAmount > 0 ? styles.positive : signedAmount < 0 ? styles.negative : styles.amount}>
                        {signedAmount > 0 ? "+" : signedAmount < 0 ? "−" : ""}{formatAmount(String(signedAmount))} CYPH
                      </strong>
                      <span style={styles.posted}>Posted</span>
                    </span>
                    <span style={styles.expandMark}>{expanded ? "−" : "+"}</span>
                  </button>

                  {expanded && (
                    <div style={styles.details}>
                      <div style={styles.detailRow}><span>Transaction ID</span><code>{transaction.id}</code></div>
                      <div style={styles.detailRow}><span>Type</span><strong>{transaction.type}</strong></div>
                      <div style={styles.detailRow}><span>Reference</span><strong>{transaction.referenceType && transaction.referenceId ? `${transaction.referenceType}: ${transaction.referenceId}` : "—"}</strong></div>
                      <div style={styles.detailRow}><span>Idempotency key</span><code>{transaction.idempotencyKey}</code></div>
                      {transaction.fundingGrant && (
                        <>
                          <div style={styles.detailRow}><span>Funding base</span><strong>{formatAmount(transaction.fundingGrant.baseAmount)} CYPH</strong></div>
                          <div style={styles.detailRow}><span>Funding bonus</span><strong>{formatAmount(transaction.fundingGrant.bonusAmount)} CYPH</strong></div>
                        </>
                      )}
                      <p style={styles.postingsTitle}>Ledger postings</p>
                      {transaction.postings.map((posting) => (
                        <div key={posting.id} style={styles.detailRow}>
                          <span>{posting.account.accountType}{posting.account.systemCode ? ` · ${posting.account.systemCode}` : ""}</span>
                          <strong>{Number(posting.amount) > 0 ? "+" : ""}{posting.amount} CYPH</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <p style={styles.disclaimer}>These are internal CypherVerse ledger records, not public blockchain transactions. “Posted” means the ledger transaction has been recorded; no public chain hash is implied.</p>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#080d18", color: "#e8eef8", padding: "40px 20px", fontFamily: "Inter, system-ui, sans-serif" },
  shell: { maxWidth: 1040, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 28 },
  eyebrow: { color: "#7dd3fc", fontSize: 12, letterSpacing: 2, fontWeight: 700, margin: "0 0 8px" },
  heading: { fontSize: 30, margin: 0, letterSpacing: -0.8 },
  muted: { color: "#91a0b7", fontSize: 13, margin: "6px 0 0" },
  backLink: { color: "#a5d8ff", textDecoration: "none", fontSize: 14 },
  linkButton: { display: "inline-block", color: "#07111f", background: "#8bd5ff", padding: "11px 16px", borderRadius: 8, textDecoration: "none", marginTop: 12 },
  summary: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: 22, border: "1px solid #26354b", borderRadius: 14, background: "#101a2a", marginBottom: 18 },
  label: { color: "#91a0b7", fontSize: 12, margin: "0 0 8px" },
  balance: { fontSize: 26, letterSpacing: -0.5 },
  refreshButton: { background: "#1c2c43", border: "1px solid #38516f", color: "#e8eef8", padding: "10px 14px", borderRadius: 8, cursor: "pointer" },
  panel: { border: "1px solid #26354b", borderRadius: 14, background: "#0e1726", padding: 22 },
  listHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 },
  sectionTitle: { margin: 0, fontSize: 19 },
  filters: { display: "flex", gap: 6 },
  filter: { background: "transparent", color: "#9aabc2", border: "1px solid #31445e", borderRadius: 7, padding: "7px 11px", cursor: "pointer" },
  activeFilter: { background: "#17334c", color: "#b8e4ff", border: "1px solid #4d91ba", borderRadius: 7, padding: "7px 11px", cursor: "pointer" },
  error: { color: "#ffaaa7", background: "#351b24", padding: 12, borderRadius: 8 },
  empty: { color: "#91a0b7", padding: "28px 0", textAlign: "center" },
  transactionList: { display: "flex", flexDirection: "column" },
  transaction: { borderTop: "1px solid #26354b" },
  transactionButton: { display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "16px 2px", border: 0, background: "transparent", color: "inherit", cursor: "pointer" },
  directionMark: { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "50%", background: "#17283b", color: "#9dd7ff", fontSize: 20, flexShrink: 0 },
  transactionMain: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 },
  transactionTitle: { textTransform: "capitalize", fontSize: 14 },
  idText: { color: "#647995", fontSize: 11, fontFamily: "monospace" },
  amountColumn: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, whiteSpace: "nowrap" },
  positive: { color: "#63d9a0", fontSize: 14 },
  negative: { color: "#ff9c9c", fontSize: 14 },
  amount: { color: "#dce7f5", fontSize: 14 },
  posted: { color: "#70cda0", fontSize: 11 },
  expandMark: { color: "#8ca0bb", fontSize: 20, width: 18, textAlign: "center" },
  details: { background: "#0a1220", border: "1px solid #26354b", borderRadius: 10, padding: 14, margin: "0 0 14px 48px" },
  detailRow: { display: "flex", justifyContent: "space-between", gap: 18, padding: "7px 0", borderBottom: "1px solid #1d2a3d", fontSize: 12, color: "#aab8ca", overflowWrap: "anywhere" },
  postingsTitle: { color: "#dce7f5", fontSize: 12, fontWeight: 700, margin: "14px 0 4px" },
  disclaimer: { color: "#71839c", fontSize: 11, lineHeight: 1.5, margin: "18px 0 0" },
};
