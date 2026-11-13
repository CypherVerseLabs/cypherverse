import { useState, type CSSProperties, type FormEvent } from "react";
import Head from "next/head";
import { useAuthContext } from "ideas/context/AuthContext";

type ActivationResponse = {
  success?: boolean;
  alreadyActive?: boolean;
  parcel?: {
    id?: string;
    estateId?: string | null;
    status?: string;
    price?: string | number | null;
  };
  error?: string;
  message?: string;
};

const DEFAULT_PARCEL_ID = "16d7a921-012f-420e-9e54-20b062586b42";
const DEFAULT_PRICE = "20.00";

function formatError(data: ActivationResponse, status: number): string {
  const code = data.error || "REQUEST_FAILED";
  const message = data.message || "The parcel could not be activated.";

  if (status === 401) {
    return "Your admin session has expired. Sign in again and retry.";
  }

  if (status === 403 || code === "ADMIN_ACCESS_REQUIRED") {
    return "Admin access is required. This account is not authorized to activate inventory.";
  }

  if (code === "PARCEL_NOT_FOUND") {
    return "That parcel ID was not found in the TEST database.";
  }

  if (code === "PRIMARY_MARKETPLACE_SELLER_NOT_CONFIGURED") {
    return "The configured primary marketplace seller is missing. No parcel changes were made.";
  }

  return `${message} (HTTP ${status}; ${code})`;
}

export default function AdminMarketplacePage() {
  const { authFetch, isAuthenticated, loading } = useAuthContext();

  const [parcelId, setParcelId] = useState(DEFAULT_PARCEL_ID);
  const [price, setPrice] = useState(DEFAULT_PRICE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ActivationResponse | null>(null);

  const normalizedPrice = price.trim();
  const validPrice = /^\d+(\.\d{1,2})?$/.test(normalizedPrice)
    && Number(normalizedPrice) >= 20\n    && Number(normalizedPrice) <= 50;
  const validParcelId = parcelId.trim().length > 0;
  const canSubmit = isAuthenticated && !loading && !submitting
    && validParcelId && validPrice;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!validParcelId || !validPrice) {
      setError("Enter a parcel ID and a USD price from $20.00 to $50.00 with no more than two decimal places.");
      return;
    }

    const confirmed = window.confirm(
      `Activate parcel ${parcelId.trim()} for $${Number(normalizedPrice).toFixed(2)} USD in TEST?\n\nThis changes the parcel from available/unowned inventory to for-sale inventory. Continue only if the parcel and price are correct.`
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      const response = await authFetch(
        `/api/admin/marketplace/primary-inventory/${encodeURIComponent(parcelId.trim())}/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ price: normalizedPrice }),
        }
      );

      const data = await response.json().catch(() => ({})) as ActivationResponse;

      if (!response.ok) {
        throw new Error(formatError(data, response.status));
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The activation request failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Marketplace | CypherVerse TEST</title>
        <meta
          name="robots"
          content="noindex, nofollow"
        />
      </Head>

      <main style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <p style={styles.eyebrow}>CYPHERVERSE ADMIN</p>
              <h1 style={styles.title}>Marketplace inventory</h1>
              <p style={styles.subtitle}>
                Activate eligible, unowned primary parcels for sale.
              </p>
            </div>
            <span style={styles.environment}>TEST ONLY</span>
          </header>

          <section style={styles.warning}>
            <strong>TEST environment</strong>
            <span>
              This page sends requests to the currently configured API. Confirm that
              your frontend is connected to the TEST backend before activating inventory.
              The server remains the authority for admin permissions and parcel eligibility.
            </span>
          </section>

          {loading ? (
            <section style={styles.panel}>
              <p style={styles.muted}>Checking your session…</p>
            </section>
          ) : !isAuthenticated ? (
            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Sign in required</h2>
              <p style={styles.muted}>
                Sign in with your CypherVerse admin account, then return to this page.
              </p>
            </section>
          ) : (
            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Primary parcel activation</h2>
              <p style={styles.muted}>
                The server checks parcel type, ownership, status, reservations,
                listings, marketplace history, and attached projects before changing inventory.
              </p>

              <form onSubmit={handleSubmit}>
                <label htmlFor="parcelId" style={styles.label}>
                  Parcel ID
                </label>
                <input
                  id="parcelId"
                  name="parcelId"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={parcelId}
                  onChange={(event) => setParcelId(event.target.value)}
                  style={styles.input}
                  required
                />
                <p style={styles.help}>
                  Prefilled with the previously reviewed TEST candidate: cv-grid-32-0.
                </p>

                <label htmlFor="price" style={styles.label}>
                  Primary sale price (USD)
                </label>
                <div style={styles.priceInputWrap}>
                  <span style={styles.currency}>$</span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="20"
                    max="50"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    style={styles.priceInput}
                    required
                  />
                  <span style={styles.currencyCode}>USD</span>
                </div>
                <p style={styles.help}>
                  Configured primary inventory price range: $20.00–$50.00 USD.
                  The backend validates the allowed range.
                </p>

                <div style={styles.summary}>
                  <div>
                    <span style={styles.summaryLabel}>Parcel</span>
                    <strong>{parcelId.trim() || "—"}</strong>
                  </div>
                  <div>
                    <span style={styles.summaryLabel}>Sale price</span>
                    <strong>
                      {validPrice
                        ? `$${Number(normalizedPrice).toFixed(2)} USD`
                        : "Enter a valid price"}
                    </strong>
                  </div>
                </div>

                {error && (
                  <div role="alert" style={styles.error}>
                    <strong>Activation not completed</strong>
                    <span>{error}</span>
                  </div>
                )}

                {result?.success && (
                  <div role="status" style={styles.success}>
                    <strong>
                      {result.alreadyActive
                        ? "Parcel was already active at this price"
                        : "Primary inventory activated"}
                    </strong>
                    <span>
                      Parcel status: {result.parcel?.status || "for_sale"}
                    </span>
                    <span>
                      Price: ${Number(result.parcel?.price ?? normalizedPrice).toFixed(2)} USD
                    </span>
                    {result.parcel?.id && (
                      <span>Parcel ID: {result.parcel.id}</span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    ...styles.button,
                    ...(!canSubmit ? styles.buttonDisabled : {}),
                  }}
                >
                  {submitting ? "Activating…" : "Review and activate parcel"}
                </button>
              </form>
            </section>
          )}

          <footer style={styles.footer}>
            <a href="/cypherVerse" style={styles.backLink}>
              Return to CypherVerse
            </a>
            <span>Admin access is enforced by the backend on every request.</span>
          </footer>
        </div>
      </main>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b1020",
    color: "#f4f6fb",
    padding: "48px 20px",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 760,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 28,
  },
  eyebrow: {
    color: "#9ba9c6",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.16em",
    margin: "0 0 10px",
  },
  title: {
    fontSize: 32,
    lineHeight: 1.15,
    margin: 0,
    fontWeight: 700,
  },
  subtitle: {
    color: "#aab5ca",
    margin: "10px 0 0",
    lineHeight: 1.5,
  },
  environment: {
    flexShrink: 0,
    border: "1px solid #b88b42",
    color: "#f2c879",
    borderRadius: 999,
    padding: "7px 11px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  warning: {
    display: "grid",
    gap: 6,
    background: "#211d16",
    border: "1px solid #6e542d",
    borderRadius: 12,
    padding: 16,
    color: "#e8d5ad",
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  panel: {
    background: "#141c2e",
    border: "1px solid #293650",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
  },
  sectionTitle: {
    fontSize: 19,
    margin: "0 0 8px",
  },
  muted: {
    color: "#aab5ca",
    fontSize: 13,
    lineHeight: 1.6,
    margin: "0 0 22px",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 650,
    margin: "20px 0 8px",
  },
  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    border: "1px solid #3a4965",
    borderRadius: 9,
    background: "#0c1425",
    color: "#f4f6fb",
    padding: "12px 13px",
    fontSize: 14,
    outline: "none",
  },
  help: {
    color: "#8f9db6",
    fontSize: 12,
    lineHeight: 1.5,
    margin: "7px 0 0",
  },
  priceInputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #3a4965",
    borderRadius: 9,
    background: "#0c1425",
    padding: "0 12px",
  },
  currency: {
    color: "#9ba9c6",
    fontSize: 16,
  },
  priceInput: {
    boxSizing: "border-box",
    flex: 1,
    minWidth: 0,
    border: 0,
    outline: "none",
    background: "transparent",
    color: "#f4f6fb",
    padding: "12px 8px",
    fontSize: 15,
  },
  currencyCode: {
    color: "#9ba9c6",
    fontSize: 12,
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 16,
    background: "#0c1425",
    border: "1px solid #293650",
    borderRadius: 10,
    padding: 14,
    marginTop: 22,
  },
  summaryLabel: {
    display: "block",
    color: "#8f9db6",
    fontSize: 11,
    marginBottom: 6,
  },
  error: {
    display: "grid",
    gap: 5,
    border: "1px solid #85434a",
    background: "#2a171d",
    color: "#ffc2c7",
    borderRadius: 9,
    padding: 13,
    marginTop: 16,
    fontSize: 13,
    lineHeight: 1.5,
  },
  success: {
    display: "grid",
    gap: 5,
    border: "1px solid #32694e",
    background: "#14281f",
    color: "#b9f0cf",
    borderRadius: 9,
    padding: 13,
    marginTop: 16,
    fontSize: 13,
    lineHeight: 1.5,
  },
  button: {
    width: "100%",
    border: 0,
    borderRadius: 9,
    background: "#8b72ff",
    color: "#fff",
    padding: "13px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    color: "#7f8da8",
    fontSize: 12,
    marginTop: 20,
  },
  backLink: {
    color: "#b8aaff",
    textDecoration: "none",
  },
};
