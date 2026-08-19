"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function CompetitionSettingsPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [settingsId, setSettingsId] = useState(null);
  const [entryFee, setEntryFee] = useState("10");
  const [firstPrize, setFirstPrize] = useState("");
  const [secondPrize, setSecondPrize] = useState("");
  const [paymentDeadline, setPaymentDeadline] = useState("");
  const [predictionRemindersEnabled, setPredictionRemindersEnabled] =
    useState(false);

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (
        profileError ||
        !profile ||
        profile.role !== "admin"
      ) {
        setMessage(
          "You do not have permission to access this page."
        );
        setLoading(false);
        return;
      }

      setAuthorised(true);

      const { data, error } = await supabase
        .from("competition_settings")
        .select(
          "id, entry_fee, first_prize, second_prize, payment_deadline, prediction_reminders_enabled"
        )
        .limit(1)
        .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setSettingsId(data.id);

      setEntryFee(
        data.entry_fee !== null &&
          data.entry_fee !== undefined
          ? String(data.entry_fee)
          : "10"
      );

      setFirstPrize(
        data.first_prize !== null &&
          data.first_prize !== undefined
          ? String(data.first_prize)
          : ""
      );

      setSecondPrize(
        data.second_prize !== null &&
          data.second_prize !== undefined
          ? String(data.second_prize)
          : ""
      );

      setPaymentDeadline(
        data.payment_deadline || ""
      );

      setPredictionRemindersEnabled(
        data.prediction_reminders_enabled === true
      );

      setLoading(false);
    }

    loadSettings();
  }, [router]);

  async function saveSettings() {
    if (!settingsId) return;

    if (!entryFee || Number(entryFee) < 0) {
      setMessage(
        "Please enter a valid entry fee."
      );
      return;
    }

    if (
      firstPrize &&
      Number(firstPrize) < 0
    ) {
      setMessage(
        "Please enter a valid 1st Prize amount."
      );
      return;
    }

    if (
      secondPrize &&
      Number(secondPrize) < 0
    ) {
      setMessage(
        "Please enter a valid 2nd Prize amount."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("competition_settings")
      .update({
        entry_fee: Number(entryFee),

        first_prize:
          firstPrize.trim() === ""
            ? null
            : Number(firstPrize),

        second_prize:
          secondPrize.trim() === ""
            ? null
            : Number(secondPrize),

        payment_deadline:
          paymentDeadline.trim() === ""
            ? null
            : paymentDeadline,

        prediction_reminders_enabled:
          predictionRemindersEnabled,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", settingsId);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(
      "Competition settings saved."
    );

    setSaving(false);
  }

  function formatPreview(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "TBC";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return "TBC";
    }

    if (Number.isInteger(amount)) {
      return `£${amount}`;
    }

    return `£${amount.toFixed(2)}`;
  }

  function formatDatePreview(value) {
    if (!value) {
      return "TBC";
    }

    const date = new Date(
      `${value}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return "TBC";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function Header() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "11px",
          marginBottom: "16px",
        }}
      >
        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          style={{
            display: "block",
            width: "58px",
            height: "auto",
            margin: 0,
            filter:
              "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
          }}
        />

        <div
          style={{
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: "27px",
              lineHeight: 0.95,
              fontWeight: "900",
              letterSpacing: "-1.2px",
              color: "#ffffff",
              whiteSpace: "nowrap",
              textShadow:
                "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            THE PREDICTO
            <span
              style={{
                color: "#ed1c24",
                textShadow:
                  "0 0 12px rgba(237,28,36,0.32)",
              }}
            >
              R
            </span>
          </div>

          <div
            style={{
              marginTop: "5px",
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "1.4px",
              color: "#a9bfd5",
            }}
          >
            ADMIN — COMPETITION SETTINGS
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main>
        <div
          className="container"
          style={{
            maxWidth: "760px",
          }}
        >
          <Header />

          <div className="card">
            <p>
              Loading settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div
          className="container"
          style={{
            maxWidth: "760px",
          }}
        >
          <Header />

          <div className="card">
            <h2>
              Access Denied
            </h2>

            <p>
              {message}
            </p>
          </div>

          <a href="/admin">
            <button>
              Back to Admin
            </button>
          </a>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div
        className="container"
        style={{
          maxWidth: "760px",
        }}
      >
        <Header />

        {message && (
          <div
            className="card"
            style={{
              padding: "12px 16px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: "800",
              }}
            >
              {message}
            </p>
          </div>
        )}

        {/* CURRENT SETTINGS PREVIEW */}

        <div
          className="card"
          style={{
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "8px",
            }}
          >
            {/* ENTRY */}

            <div
              style={{
                padding: "12px 7px",
                borderRadius: "9px",
                background: "#071d36",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "0.7px",
                  color: "#b9cee2",
                }}
              >
                ENTRY
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "900",
                }}
              >
                {formatPreview(entryFee)}
              </div>
            </div>

            {/* 1ST PRIZE */}

            <div
              style={{
                padding: "12px 7px",
                borderRadius: "9px",
                background: "#d9a900",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "0.7px",
                  color: "#fff7d1",
                }}
              >
                1ST PRIZE
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "900",
                }}
              >
                {formatPreview(firstPrize)}
              </div>
            </div>

            {/* 2ND PRIZE */}

            <div
              style={{
                padding: "12px 7px",
                borderRadius: "9px",
                background: "#8d99a6",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "0.7px",
                }}
              >
                2ND PRIZE
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "900",
                }}
              >
                {formatPreview(secondPrize)}
              </div>
            </div>

            {/* PAYMENT DEADLINE */}

            <div
              style={{
                padding: "12px 7px",
                borderRadius: "9px",
                background:
                  "linear-gradient(135deg, #8f1018 0%, #d71920 100%)",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "0.7px",
                  color: "#ffd9dc",
                }}
              >
                PAYMENT DEADLINE
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "15px",
                  fontWeight: "900",
                  lineHeight: 1.2,
                }}
              >
                {formatDatePreview(
                  paymentDeadline
                )}
              </div>
            </div>

            {/* EMAIL REMINDER STATUS */}

            <div
              style={{
                padding: "12px 7px",
                borderRadius: "9px",
                background:
                  predictionRemindersEnabled
                    ? "linear-gradient(135deg, #116b3d 0%, #18a15c 100%)"
                    : "linear-gradient(135deg, #59697a 0%, #7c8b99 100%)",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "0.7px",
                  color:
                    predictionRemindersEnabled
                      ? "#d9f7e7"
                      : "#edf1f4",
                }}
              >
                EMAIL REMINDERS
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "900",
                }}
              >
                {predictionRemindersEnabled
                  ? "ON"
                  : "OFF"}
              </div>
            </div>
          </div>
        </div>

        {/* EDIT SETTINGS */}

        <div
          className="card"
          style={{
            padding: "18px 16px",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1px",
                color: "#7c8fa2",
              }}
            >
              COMPETITION SETTINGS
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "24px",
                fontWeight: "900",
                color: "#071d36",
              }}
            >
              Entry, Prizes & Payment
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "15px",
              textAlign: "left",
            }}
          >
            {/* ENTRY FEE */}

            <label>
              <strong
                style={{
                  fontSize: "13px",
                  color: "#354b61",
                }}
              >
                Entry Fee (£)
              </strong>

              <input
                type="number"
                min="0"
                step="0.01"
                value={entryFee}
                onChange={(e) =>
                  setEntryFee(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  boxSizing:
                    "border-box",
                  fontSize: "16px",
                }}
              />
            </label>

            {/* 1ST PRIZE */}

            <label>
              <strong
                style={{
                  fontSize: "13px",
                  color: "#354b61",
                }}
              >
                1st Prize (£)
              </strong>

              <input
                type="number"
                min="0"
                step="0.01"
                value={firstPrize}
                onChange={(e) =>
                  setFirstPrize(
                    e.target.value
                  )
                }
                placeholder="Leave blank for TBC"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  boxSizing:
                    "border-box",
                  fontSize: "16px",
                }}
              />
            </label>

            {/* 2ND PRIZE */}

            <label>
              <strong
                style={{
                  fontSize: "13px",
                  color: "#354b61",
                }}
              >
                2nd Prize (£)
              </strong>

              <input
                type="number"
                min="0"
                step="0.01"
                value={secondPrize}
                onChange={(e) =>
                  setSecondPrize(
                    e.target.value
                  )
                }
                placeholder="Leave blank for TBC"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  boxSizing:
                    "border-box",
                  fontSize: "16px",
                }}
              />
            </label>

            {/* PAYMENT DEADLINE */}

            <label>
              <strong
                style={{
                  fontSize: "13px",
                  color: "#354b61",
                }}
              >
                Payment Closing Date
              </strong>

              <input
                type="date"
                value={paymentDeadline}
                onChange={(e) =>
                  setPaymentDeadline(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  boxSizing:
                    "border-box",
                  fontSize: "16px",
                }}
              />

              <div
                style={{
                  marginTop: "6px",
                  color: "#71869a",
                  fontSize: "11px",
                  fontWeight: "700",
                  lineHeight: 1.4,
                }}
              >
                Unpaid entrants will be reminded on the
                Predictor home page.
              </div>
            </label>

            {/* PREDICTION REMINDER EMAILS */}

            <div
              style={{
                padding: "15px",
                borderRadius: "10px",
                background:
                  predictionRemindersEnabled
                    ? "#edf8f2"
                    : "#f1f4f7",
                border:
                  predictionRemindersEnabled
                    ? "1px solid #acd8be"
                    : "1px solid #d7dee7",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "900",
                      color: "#071d36",
                    }}
                  >
                    Prediction Reminder Emails
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#65788c",
                      fontSize: "11px",
                      fontWeight: "700",
                      lineHeight: 1.45,
                    }}
                  >
                    Send an automatic reminder to entrants
                    who have not completed all their
                    predictions approximately 24 hours
                    before that Match Week closes.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPredictionRemindersEnabled(
                      (current) => !current
                    )
                  }
                  style={{
                    width: "74px",
                    minWidth: "74px",
                    padding: "11px 8px",
                    margin: 0,
                    borderRadius: "9px",
                    border: "none",
                    background:
                      predictionRemindersEnabled
                        ? "#16884e"
                        : "#68798a",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "900",
                    boxShadow:
                      predictionRemindersEnabled
                        ? "0 3px 0 #0d5f35"
                        : "0 3px 0 #465565",
                    cursor: "pointer",
                  }}
                >
                  {predictionRemindersEnabled
                    ? "ON"
                    : "OFF"}
                </button>
              </div>

              <div
                style={{
                  marginTop: "11px",
                  padding: "9px 10px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#71869a",
                  fontSize: "10px",
                  fontWeight: "700",
                  lineHeight: 1.45,
                }}
              >
                Each reminder will check only the specific
                Match Week approaching its deadline. Any
                later Match Weeks already open for
                predictions are ignored.
              </div>
            </div>

            {/* INFO */}

            <div
              style={{
                padding: "11px 12px",
                borderRadius: "9px",
                background: "#f1f4f7",
                border:
                  "1px solid #d7dee7",
                color: "#65788c",
                fontSize: "12px",
                fontWeight: "700",
                lineHeight: 1.5,
              }}
            >
              Leave a prize field blank and the Rules page
              will show
              <strong> TBC</strong>.
              <br />

              Leave the payment closing date blank if you
              do not want to show a payment deadline.
              <br />

              Prediction reminder emails can be switched
              on or off at any time.
            </div>

            {/* SAVE */}

            <button
              onClick={saveSettings}
              disabled={saving}
              style={{
                opacity:
                  saving
                    ? 0.5
                    : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Competition Settings"}
            </button>
          </div>
        </div>

        <a href="/admin">
          <button>
            Back to Admin
          </button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}
