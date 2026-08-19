"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PredictorPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentWeek, setCurrentWeek] = useState(null);
  const [predictionStatus, setPredictionStatus] = useState(null);

  const [entryFee, setEntryFee] = useState(null);
  const [paymentDeadline, setPaymentDeadline] = useState(null);

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      /* =====================================================
         PROFILE
         ===================================================== */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "first_name, surname, team_name, role, paid"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Profile load error:",
          profileError
        );
      }

      setProfile(profileData);

      /* =====================================================
         COMPETITION SETTINGS
         ===================================================== */

      const {
        data: settingsData,
        error: settingsError,
      } = await supabase
        .from("competition_settings")
        .select(
          "entry_fee, payment_deadline"
        )
        .limit(1)
        .single();

      if (settingsError) {
        console.error(
          "Competition settings load error:",
          settingsError
        );
      } else if (settingsData) {
        setEntryFee(
          settingsData.entry_fee
        );

        setPaymentDeadline(
          settingsData.payment_deadline
        );
      }

      /* =====================================================
         CURRENT MATCH WEEK
         ===================================================== */

      const now = new Date().toISOString();

      const { data: weekData } = await supabase
        .from("match_weeks")
        .select(
          "id, week_no, deadline"
        )
        .gt("deadline", now)
        .order("week_no", {
          ascending: true,
        })
        .limit(1);

      if (
        weekData &&
        weekData.length > 0
      ) {
        const week =
          weekData[0];

        setCurrentWeek(week);

        const { data: fixtureData } =
          await supabase
            .from("fixtures")
            .select("id, status")
            .eq(
              "match_week_id",
              week.id
            )
            .neq(
              "status",
              "cancelled"
            );

        const fixtureIds =
          (fixtureData || []).map(
            (fixture) =>
              fixture.id
          );

        let completed = 0;

        if (
          fixtureIds.length > 0
        ) {
          const {
            data: predictionData,
          } = await supabase
            .from("predictions")
            .select("fixture_id")
            .eq(
              "user_id",
              user.id
            )
            .in(
              "fixture_id",
              fixtureIds
            );

          completed =
            (
              predictionData || []
            ).length;
        }

        setPredictionStatus({
          completed,
          total:
            fixtureIds.length,
        });
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  /* =====================================================
     SIGN OUT
     ===================================================== */

  async function handleSignOut() {
    setSigningOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  /* =====================================================
     MONEY FORMAT
     ===================================================== */

  function formatMoney(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "£0";
    }

    const amount =
      Number(value);

    if (
      Number.isNaN(amount)
    ) {
      return "£0";
    }

    if (
      Number.isInteger(amount)
    ) {
      return `£${amount}`;
    }

    return `£${amount.toFixed(
      2
    )}`;
  }

  /* =====================================================
     PAYMENT DATE FORMAT
     ===================================================== */

  function formatPaymentDate(
    value
  ) {
    if (!value) {
      return null;
    }

    const date =
      new Date(
        `${value}T12:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  /* =====================================================
     PAYMENT DEADLINE STATUS
     ===================================================== */

  function getPaymentStatus() {
    if (!paymentDeadline) {
      return "no-deadline";
    }

    const deadlineDate =
      new Date(
        `${paymentDeadline}T12:00:00`
      );

    const today =
      new Date();

    today.setHours(
      12,
      0,
      0,
      0
    );

    if (
      today.getTime() ===
      deadlineDate.getTime()
    ) {
      return "today";
    }

    if (
      today >
      deadlineDate
    ) {
      return "overdue";
    }

    return "due";
  }

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <main>
        <div
          className="container"
          style={{
            maxWidth:
              "760px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: "11px",
              marginBottom:
                "18px",
            }}
          >
            <img
              src="/TWHC-badge-white.png"
              alt="Telford & Wrekin Hockey Club"
              style={{
                width:
                  "58px",
                height:
                  "auto",
                margin: 0,
              }}
            />

            <div
              style={{
                textAlign:
                  "left",
              }}
            >
              <div
                style={{
                  fontSize:
                    "27px",
                  lineHeight:
                    0.95,
                  fontWeight:
                    "900",
                  letterSpacing:
                    "-1.2px",
                  color:
                    "#ffffff",
                  whiteSpace:
                    "nowrap",
                }}
              >
                THE PREDICTO
                <span
                  style={{
                    color:
                      "#ed1c24",
                  }}
                >
                  R
                </span>
              </div>

              <div
                style={{
                  marginTop:
                    "5px",
                  fontSize:
                    "11px",
                  fontWeight:
                    "900",
                  letterSpacing:
                    "1.4px",
                  color:
                    "#a9bfd5",
                }}
              >
                LOADING...
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     PREDICTION STATUS
     ===================================================== */

  const allComplete =
    predictionStatus &&
    predictionStatus.total >
      0 &&
    predictionStatus.completed ===
      predictionStatus.total;

  const remaining =
    predictionStatus
      ? predictionStatus.total -
        predictionStatus.completed
      : 0;

  /* =====================================================
     PAYMENT REMINDER
     ===================================================== */

  const showPaymentReminder =
    profile?.paid === false;

  const paymentStatus =
    getPaymentStatus();

  const formattedPaymentDeadline =
    formatPaymentDate(
      paymentDeadline
    );

  const formattedEntryFee =
    formatMoney(entryFee);

  return (
    <main>
      <div
        className="container"
        style={{
          maxWidth:
            "760px",
        }}
      >
        {/* =================================================
            COMPACT HEADER
            ================================================= */}

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            gap: "11px",
            marginBottom:
              "16px",
          }}
        >
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            style={{
              display:
                "block",
              width:
                "58px",
              height:
                "auto",
              margin: 0,
              filter:
                "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
            }}
          />

          <div
            style={{
              textAlign:
                "left",
            }}
          >
            <div
              style={{
                fontSize:
                  "27px",
                lineHeight:
                  0.95,
                fontWeight:
                  "900",
                letterSpacing:
                  "-1.2px",
                color:
                  "#ffffff",
                whiteSpace:
                  "nowrap",
                textShadow:
                  "0 2px 8px rgba(0,0,0,0.35)",
              }}
            >
              THE PREDICTO
              <span
                style={{
                  color:
                    "#ed1c24",
                  textShadow:
                    "0 0 12px rgba(237,28,36,0.32)",
                }}
              >
                R
              </span>
            </div>

            <div
              style={{
                marginTop:
                  "5px",
                fontSize:
                  "11px",
                fontWeight:
                  "900",
                letterSpacing:
                  "1.4px",
                color:
                  "#a9bfd5",
              }}
            >
              PREDICT. COMPETE. WIN.
            </div>
          </div>
        </div>

        {/* =================================================
            WELCOME
            ================================================= */}

        <div
          style={{
            marginBottom:
              "16px",
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize:
                "14px",
              color:
                "#b9cee2",
              fontWeight:
                "700",
            }}
          >
            Welcome,{" "}
            {profile?.first_name}{" "}
            {profile?.surname}
          </div>

          {profile?.team_name && (
            <div
              style={{
                marginTop:
                  "3px",
                fontSize:
                  "18px",
                fontWeight:
                  "900",
                color:
                  "#ffffff",
              }}
            >
              {
                profile.team_name
              }
            </div>
          )}
        </div>

        {/* =================================================
            PAYMENT REMINDER
            ================================================= */}

        {showPaymentReminder && (
          <div
            className="card"
            style={{
              position:
                "relative",
              overflow:
                "hidden",
              padding:
                "0",
              border:
                paymentStatus ===
                "overdue"
                  ? "1px solid rgba(237,28,36,0.55)"
                  : "1px solid rgba(255,177,31,0.45)",
              boxShadow:
                paymentStatus ===
                "overdue"
                  ? "0 10px 28px rgba(237,28,36,0.16), 0 5px 14px rgba(0,0,0,0.20)"
                  : "0 10px 28px rgba(255,157,0,0.12), 0 5px 14px rgba(0,0,0,0.20)",
            }}
          >
            {/* TOP BAR */}

            <div
              style={{
                height:
                  "6px",
                background:
                  paymentStatus ===
                  "overdue"
                    ? "linear-gradient(90deg, #8f0d15 0%, #ed1c24 50%, #8f0d15 100%)"
                    : "linear-gradient(90deg, #d27b00 0%, #ffb11f 50%, #d27b00 100%)",
              }}
            />

            <div
              style={{
                padding:
                  "17px 16px 16px",
              }}
            >
              {/* HEADING */}

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap:
                    "12px",
                  marginBottom:
                    "12px",
                }}
              >
                <div
                  style={{
                    textAlign:
                      "left",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "10px",
                      fontWeight:
                        "900",
                      letterSpacing:
                        "1.1px",
                      color:
                        paymentStatus ===
                        "overdue"
                          ? "#cf171f"
                          : "#b06b00",
                    }}
                  >
                    {paymentStatus ===
                    "overdue"
                      ? "PAYMENT OVERDUE"
                      : paymentStatus ===
                        "today"
                      ? "PAYMENT DUE TODAY"
                      : "ENTRY FEE OUTSTANDING"}
                  </div>

                  <div
                    style={{
                      marginTop:
                        "3px",
                      fontSize:
                        "21px",
                      lineHeight:
                        1.1,
                      fontWeight:
                        "900",
                      color:
                        "#071d36",
                    }}
                  >
                    Predictor Entry
                    Fee
                  </div>
                </div>

                {/* AMOUNT */}

                <div
                  style={{
                    flexShrink:
                      0,
                    minWidth:
                      "78px",
                    padding:
                      "10px 11px",
                    borderRadius:
                      "10px",
                    background:
                      paymentStatus ===
                      "overdue"
                        ? "linear-gradient(135deg, #981019 0%, #df1b23 100%)"
                        : "linear-gradient(135deg, #c87b00 0%, #ef9f12 100%)",
                    color:
                      "#ffffff",
                    textAlign:
                      "center",
                    boxShadow:
                      "0 4px 10px rgba(0,0,0,0.18)",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "8px",
                      fontWeight:
                        "900",
                      letterSpacing:
                        "0.8px",
                      opacity:
                        0.85,
                    }}
                  >
                    TO PAY
                  </div>

                  <div
                    style={{
                      marginTop:
                        "2px",
                      fontSize:
                        "21px",
                      lineHeight:
                        1,
                      fontWeight:
                        "900",
                    }}
                  >
                    {
                      formattedEntryFee
                    }
                  </div>
                </div>
              </div>

              {/* MESSAGE */}

              {paymentStatus ===
              "overdue" ? (
                <div
                  style={{
                    padding:
                      "11px 12px",
                    borderRadius:
                      "9px",
                    background:
                      "#fde9ea",
                    border:
                      "1px solid #efb6b9",
                    color:
                      "#a91920",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.5,
                    fontWeight:
                      "700",
                    textAlign:
                      "left",
                  }}
                >
                  Your{" "}
                  <strong>
                    {
                      formattedEntryFee
                    }{" "}
                    Predictor entry
                    fee
                  </strong>{" "}
                  has not yet been
                  marked as paid.

                  {formattedPaymentDeadline && (
                    <>
                      {" "}
                      The payment
                      closing date was{" "}
                      <strong>
                        {
                          formattedPaymentDeadline
                        }
                      </strong>
                      .
                    </>
                  )}

                  <br />
                  <br />

                  Please contact the
                  competition organiser
                  as soon as possible.
                </div>
              ) : paymentStatus ===
                "today" ? (
                <div
                  style={{
                    padding:
                      "11px 12px",
                    borderRadius:
                      "9px",
                    background:
                      "#fff3dd",
                    border:
                      "1px solid #efcf93",
                    color:
                      "#83520b",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.5,
                    fontWeight:
                      "700",
                    textAlign:
                      "left",
                  }}
                >
                  Your{" "}
                  <strong>
                    {
                      formattedEntryFee
                    }{" "}
                    Predictor entry
                    fee
                  </strong>{" "}
                  has not yet been
                  marked as paid.

                  <br />
                  <br />

                  <strong>
                    Payment is due
                    today.
                  </strong>
                </div>
              ) : (
                <div
                  style={{
                    padding:
                      "11px 12px",
                    borderRadius:
                      "9px",
                    background:
                      "#fff7e8",
                    border:
                      "1px solid #efd5a5",
                    color:
                      "#795117",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.5,
                    fontWeight:
                      "700",
                    textAlign:
                      "left",
                  }}
                >
                  Your{" "}
                  <strong>
                    {
                      formattedEntryFee
                    }{" "}
                    Predictor entry
                    fee
                  </strong>{" "}
                  has not yet been
                  marked as paid.

                  {formattedPaymentDeadline ? (
                    <>
                      {" "}
                      Please make
                      payment by{" "}
                      <strong>
                        {
                          formattedPaymentDeadline
                        }
                      </strong>{" "}
                      to complete your
                      competition
                      entry.
                    </>
                  ) : (
                    <>
                      {" "}
                      Please make
                      payment to
                      complete your
                      competition
                      entry.
                    </>
                  )}
                </div>
              )}

              {/* SMALL NOTE */}

              <div
                style={{
                  marginTop:
                    "10px",
                  color:
                    "#71869a",
                  fontSize:
                    "10px",
                  fontWeight:
                    "700",
                  lineHeight:
                    1.4,
                }}
              >
                This reminder will
                disappear automatically
                once your entry has been
                marked as paid.
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            CURRENT MATCH WEEK
            ================================================= */}

        {currentWeek &&
          predictionStatus && (
            <div
              className="card"
              style={{
                padding:
                  "18px 16px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap:
                    "14px",
                  marginBottom:
                    "15px",
                }}
              >
                <div
                  style={{
                    textAlign:
                      "left",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        "900",
                      letterSpacing:
                        "1px",
                      color:
                        "#7c8fa2",
                    }}
                  >
                    CURRENT
                  </div>

                  <div
                    style={{
                      marginTop:
                        "2px",
                      fontSize:
                        "23px",
                      fontWeight:
                        "900",
                      color:
                        "#071d36",
                    }}
                  >
                    Match Week{" "}
                    {
                      currentWeek.week_no
                    }
                  </div>
                </div>

                <div
                  style={{
                    flexShrink:
                      0,
                    minWidth:
                      "70px",
                    padding:
                      "9px 10px",
                    borderRadius:
                      "9px",
                    background:
                      allComplete
                        ? "#16733f"
                        : "#071d36",
                    color:
                      "#ffffff",
                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "18px",
                      lineHeight:
                        1,
                      fontWeight:
                        "900",
                    }}
                  >
                    {
                      predictionStatus.completed
                    }
                    /
                    {
                      predictionStatus.total
                    }
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "8px",
                      fontWeight:
                        "900",
                      letterSpacing:
                        "0.7px",
                      color:
                        allComplete
                          ? "#d7f2e0"
                          : "#b9cee2",
                    }}
                  >
                    SELECTED
                  </div>
                </div>
              </div>

              {allComplete ? (
                <div
                  style={{
                    marginBottom:
                      "14px",
                    padding:
                      "10px 12px",
                    borderRadius:
                      "9px",
                    background:
                      "#e7f7ed",
                    border:
                      "1px solid #aad8bb",
                    color:
                      "#16733f",
                    fontSize:
                      "13px",
                    fontWeight:
                      "900",
                  }}
                >
                  ✓ All predictions
                  completed
                </div>
              ) : (
                <div
                  style={{
                    marginBottom:
                      "14px",
                    padding:
                      "10px 12px",
                    borderRadius:
                      "9px",
                    background:
                      "#fff4e5",
                    border:
                      "1px solid #efd09a",
                    color:
                      "#8c5c0e",
                    fontSize:
                      "13px",
                    fontWeight:
                      "900",
                  }}
                >
                  {remaining}{" "}
                  prediction
                  {remaining === 1
                    ? ""
                    : "s"}{" "}
                  still required
                </div>
              )}

              <a href="/predictions">
                <button>
                  {allComplete
                    ? "Review Predictions"
                    : "Complete Predictions"}
                </button>
              </a>
            </div>
          )}

        {/* =================================================
            MAIN MENU
            ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap:
              "14px",
            marginBottom:
              "16px",
          }}
        >
          {/* PREDICTIONS */}

          <a
            href="/predictions"
            style={{
              display:
                "block",
            }}
          >
            <div
              className="card"
              style={{
                height:
                  "100%",
                marginBottom:
                  0,
                padding:
                  "19px 16px",
                cursor:
                  "pointer",
              }}
            >
              <div
                style={{
                  fontSize:
                    "30px",
                  marginBottom:
                    "7px",
                }}
              >
                ✓
              </div>

              <h2>
                Predictions
              </h2>

              <p>
                View the fixtures
                and make or review
                your selections.
              </p>

              <button>
                Make Predictions
              </button>
            </div>
          </a>

          {/* OVERALL LEADERBOARD */}

          <a
            href="/leaderboard"
            style={{
              display:
                "block",
            }}
          >
            <div
              className="card"
              style={{
                height:
                  "100%",
                marginBottom:
                  0,
                padding:
                  "19px 16px",
                cursor:
                  "pointer",
              }}
            >
              <div
                style={{
                  fontSize:
                    "30px",
                  marginBottom:
                    "7px",
                }}
              >
                🏆
              </div>

              <h2>
                Overall Leaderboard
              </h2>

              <p>
                See who&apos;s
                leading The
                Predictor across
                the season.
              </p>

              <button>
                View Leaderboard
              </button>
            </div>
          </a>

          {/* WEEKLY LEADERBOARD */}

          <a
            href="/last-week"
            style={{
              display:
                "block",
            }}
          >
            <div
              className="card"
              style={{
                height:
                  "100%",
                marginBottom:
                  0,
                padding:
                  "19px 16px",
                cursor:
                  "pointer",
              }}
            >
              <div
                style={{
                  fontSize:
                    "30px",
                  marginBottom:
                    "7px",
                }}
              >
                📊
              </div>

              <h2>
                Weekly Leaderboards
              </h2>

              <p>
                View results and
                standings from
                completed Match
                Weeks.
              </p>

              <button>
                Weekly Leaderboards
              </button>
            </div>
          </a>

          {/* RULES */}

          <a
            href="/rules"
            style={{
              display:
                "block",
            }}
          >
            <div
              className="card"
              style={{
                height:
                  "100%",
                marginBottom:
                  0,
                padding:
                  "19px 16px",
                cursor:
                  "pointer",
              }}
            >
              <div
                style={{
                  fontSize:
                    "30px",
                  marginBottom:
                    "7px",
                }}
              >
                📋
              </div>

              <h2>
                Competition Rules
              </h2>

              <p>
                Check scoring,
                deadlines, prizes
                and competition
                rules.
              </p>

              <button>
                View Rules
              </button>
            </div>
          </a>

          {/* ADMIN */}

          {profile?.role ===
            "admin" && (
            <a
              href="/admin"
              style={{
                display:
                  "block",
              }}
            >
              <div
                className="card"
                style={{
                  height:
                    "100%",
                  marginBottom:
                    0,
                  padding:
                    "19px 16px",
                  cursor:
                    "pointer",
                  border:
                    "1px solid rgba(237,28,36,0.35)",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "30px",
                    marginBottom:
                      "7px",
                  }}
                >
                  ⚙️
                </div>

                <h2>
                  Administrator
                </h2>

                <p>
                  Manage members,
                  fixtures,
                  results and
                  competition
                  settings.
                </p>

                <button
                  style={{
                    background:
                      "#e31b23",
                    boxShadow:
                      "0 3px 0 #a20d13, 0 6px 12px rgba(0,0,0,0.16)",
                  }}
                >
                  Admin Area
                </button>
              </div>
            </a>
          )}
        </div>

        {/* =================================================
            SIGN OUT
            ================================================= */}

        <button
          onClick={
            handleSignOut
          }
          disabled={
            signingOut
          }
          style={{
            background:
              "#536579",
            boxShadow:
              "0 3px 0 #354657, 0 5px 10px rgba(0,0,0,0.16)",
            opacity:
              signingOut
                ? 0.5
                : 1,
            marginTop:
              "4px",
          }}
        >
          {signingOut
            ? "Signing Out..."
            : "Sign Out"}
        </button>

        <p className="footer">
          Telford & Wrekin
          Hockey Club
        </p>
      </div>
    </main>
  );
}
