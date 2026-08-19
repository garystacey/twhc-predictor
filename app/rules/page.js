"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RulesPage() {
  const [settings, setSettings] = useState({
    entry_fee: 10,
    first_prize: null,
    second_prize: null,
  });

  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadCompetitionSettings() {
      const { data, error } = await supabase
        .from("competition_settings")
        .select("entry_fee, first_prize, second_prize")
        .limit(1)
        .single();

      if (!error && data) {
        setSettings(data);
      }

      setLoadingSettings(false);
    }

    loadCompetitionSettings();
  }, []);

  function formatMoney(value) {
    if (value === null || value === undefined || value === "") {
      return "TBC";
    }

    const amount = Number(value);

    if (Number.isInteger(amount)) {
      return `£${amount}`;
    }

    return `£${amount.toFixed(2)}`;
  }

  const ruleCardStyle = {
    padding: "18px 16px",
    marginBottom: "14px",
  };

  const bodyStyle = {
    textAlign: "left",
    lineHeight: "1.6",
    color: "#42566b",
    fontSize: "14px",
  };

  return (
    <main>
      <div
        className="container"
        style={{
          maxWidth: "760px",
        }}
      >
        {/* HEADER */}

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
              COMPETITION RULES
            </div>
          </div>
        </div>

        {/* INTRO */}

        <div
          style={{
            marginBottom: "15px",
            textAlign: "center",
            color: "#b9cee2",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          Everything you need to know about playing The Predictor.
        </div>

        {/* ENTRY FEE */}

        <div
          className="card"
          style={{
            ...ruleCardStyle,
            border:
              "1px solid rgba(237,28,36,0.28)",
          }}
        >
          <div
            style={{
              marginBottom: "14px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "1px",
                color: "#c2171f",
              }}
            >
              ENTRY & PRIZES
            </div>

            <h2
              style={{
                marginTop: "3px",
                marginBottom: 0,
              }}
            >
              Entry Fee & Prize Money
            </h2>
          </div>

          <div style={bodyStyle}>
            {loadingSettings ? (
              <p>Loading competition details...</p>
            ) : (
              <>
                <div
                  style={{
                    padding: "13px 14px",
                    marginBottom: "14px",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #071d36 0%, #0c2c50 100%)",
                    color: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "900",
                      letterSpacing: "0.8px",
                      color: "#b9cee2",
                    }}
                  >
                    ENTRY FEE
                  </div>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "24px",
                      fontWeight: "900",
                    }}
                  >
                    {formatMoney(settings.entry_fee)}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 13px",
                      borderRadius: "9px",
                      background: "#f4f7fa",
                      border: "1px solid #d7e0e9",
                    }}
                  >
                    <strong
                      style={{
                        color: "#071d36",
                      }}
                    >
                      Pay via Teamo
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                      }}
                    >
                      The entry fee can be paid via the{" "}
                      <strong>
                        Telford & Wrekin HC Teamo app
                      </strong>
                      .
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 13px",
                      borderRadius: "9px",
                      background: "#fff6f6",
                      border: "1px solid #f0c6c8",
                    }}
                  >
                    <strong
                      style={{
                        color: "#b6161d",
                      }}
                    >
                      Not registered on Teamo?
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                      }}
                    >
                      If you are not registered on the Teamo app,
                      payment can also be made at the{" "}
                      <strong>hockey pitch café</strong> via{" "}
                      <strong>SumUp</strong>.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "8px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "9px",
                      background: "#f7f2dc",
                      border: "1px solid #e1cf86",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: "900",
                        color: "#8a6b00",
                      }}
                    >
                      1ST PRIZE
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "18px",
                        fontWeight: "900",
                        color: "#6a5300",
                      }}
                    >
                      {formatMoney(settings.first_prize)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "9px",
                      background: "#eef1f4",
                      border: "1px solid #cfd6dd",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: "900",
                        color: "#657382",
                      }}
                    >
                      2ND PRIZE
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "18px",
                        fontWeight: "900",
                        color: "#4f5d6a",
                      }}
                    >
                      {formatMoney(settings.second_prize)}
                    </div>
                  </div>
                </div>

                <p>
                  Prize amounts will be confirmed once the prize fund has
                  been finalised.
                </p>

                <p>
                  If two or more entrants are tied for 1st place, the 1st
                  and 2nd prize funds will be combined and divided equally
                  between the joint winners.
                </p>

                <p>
                  If there is one outright winner and two or more entrants
                  are tied for 2nd place, the 2nd prize will be divided
                  equally between those entrants.
                </p>
              </>
            )}
          </div>
        </div>

        {/* HOW TO PLAY */}

        <div className="card" style={ruleCardStyle}>
          <h2>How To Play</h2>

          <div style={bodyStyle}>
            <p>
              Each Match Week you predict the result of the listed
              Telford & Wrekin Hockey Club fixtures.
            </p>

            <p>For every fixture, choose one of:</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: "8px",
              }}
            >
              {[
                ["H", "Home Win"],
                ["D", "Draw"],
                ["A", "Away Win"],
              ].map(([letter, text]) => (
                <div
                  key={letter}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "9px",
                    background: "#f3f6f9",
                    border: "1px solid #d7dee7",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      margin: "0 auto 6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: "#071d36",
                      color: "#ffffff",
                      fontWeight: "900",
                    }}
                  >
                    {letter}
                  </div>

                  <strong>{text}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SCORING */}

        <div className="card" style={ruleCardStyle}>
          <h2>Scoring</h2>

          <div style={bodyStyle}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  borderRadius: "9px",
                  background: "#e7f7ed",
                  border: "1px solid #aad8bb",
                  color: "#16733f",
                  textAlign: "center",
                  fontWeight: "900",
                }}
              >
                ✓ Correct = 1 point
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "9px",
                  background: "#f8ecec",
                  border: "1px solid #e4b4b7",
                  color: "#a51b22",
                  textAlign: "center",
                  fontWeight: "900",
                }}
              >
                ✕ Incorrect = 0 points
              </div>
            </div>

            <p>
              Points are calculated automatically once the actual fixture
              results have been entered.
            </p>

            <p>
              Cancelled fixtures do not count and no points can be won or
              lost on them.
            </p>
          </div>
        </div>

        {/* PREDICTION WINDOWS */}

        <div className="card" style={ruleCardStyle}>
          <h2>Prediction Windows</h2>

          <div style={bodyStyle}>
            <p>
              Each Match Week has its own opening time and prediction
              deadline.
            </p>

            <p>
              You can make or change your selections at any time while
              that Match Week is open.
            </p>

            <p>
              Once the deadline has passed, all predictions are locked
              and can no longer be changed.
            </p>

            <p>
              Locked predictions remain available to view afterwards,
              so you can check what you selected.
            </p>
          </div>
        </div>

        {/* MISSED PREDICTIONS */}

        <div className="card" style={ruleCardStyle}>
          <h2>Missed Predictions</h2>

          <div style={bodyStyle}>
            <p>You do not have to predict every fixture.</p>

            <p>
              However, if you do not submit a prediction for a fixture
              before the deadline, that fixture will score
              <strong> 0 points</strong>.
            </p>

            <p>
              No prediction will be entered automatically and missing
              predictions cannot be added after the deadline.
            </p>
          </div>
        </div>

        {/* POSTPONED */}

        <div className="card" style={ruleCardStyle}>
          <h2>Postponed Fixtures</h2>

          <div style={bodyStyle}>
            <p>
              If a fixture is postponed, your original prediction will
              remain valid.
            </p>

            <p>
              The prediction will carry forward until the rearranged
              fixture is played.
            </p>

            <p>
              You will not be able to change your original prediction
              because of the postponement.
            </p>

            <p>
              Points will be awarded once the rearranged fixture has
              been completed and the result has been entered.
            </p>
          </div>
        </div>

        {/* CANCELLED */}

        <div className="card" style={ruleCardStyle}>
          <h2>Cancelled Fixtures</h2>

          <div style={bodyStyle}>
            <p>
              If a fixture is cancelled and will not be played, it will
              be removed from the active prediction list.
            </p>

            <p>
              Any prediction already made for that fixture will not
              count.
            </p>

            <p>
              No points will be awarded and the fixture will be excluded
              from the total number of available points for that Match
              Week.
            </p>

            <p>
              Cancelled fixtures will still be visible in the historical
              Match Week record for reference.
            </p>
          </div>
        </div>

        {/* LEADERBOARDS */}

        <div className="card" style={ruleCardStyle}>
          <h2>Leaderboards</h2>

          <div style={bodyStyle}>
            <p>
              <strong>Overall Leaderboard</strong>
              <br />
              Shows each entrant&apos;s total points across the
              competition.
            </p>

            <p>
              <strong>Weekly Leaderboards</strong>
              <br />
              Shows the points scored in each completed Match Week.
            </p>

            <p>
              Previous Weekly Leaderboards remain available, so you can
              look back at any completed Match Week.
            </p>

            <p>
              Once a Match Week has closed, entrants can view other
              players&apos; predictions, actual results and which
              selections were correct or incorrect.
            </p>

            <p>
              Players only appear on a leaderboard once they have made
              at least one relevant prediction.
            </p>
          </div>
        </div>

        {/* TIES */}

        <div className="card" style={ruleCardStyle}>
          <h2>Tied Positions</h2>

          <div style={bodyStyle}>
            <p>
              Entrants with the same number of points share the same
              leaderboard position.
            </p>

            <p>Standard competition ranking is used.</p>

            <div
              style={{
                padding: "11px 12px",
                borderRadius: "9px",
                background: "#f3f6f9",
                border: "1px solid #d7dee7",
                textAlign: "center",
                fontWeight: "900",
                color: "#071d36",
              }}
            >
              Example: 1st, 1st, 3rd
            </div>
          </div>
        </div>

        {/* PROVISIONAL */}

        <div className="card" style={ruleCardStyle}>
          <h2>Provisional Standings</h2>

          <div style={bodyStyle}>
            <p>
              Weekly standings may be shown as provisional while some
              fixture results are still outstanding.
            </p>

            <p>
              Only fixtures with confirmed results contribute to the
              points total at that time.
            </p>

            <p>
              Outstanding postponed fixtures will remain pending until
              the result is eventually entered.
            </p>
          </div>
        </div>

        {/* ACCOUNTS */}

        <div className="card" style={ruleCardStyle}>
          <h2>Accounts & Team Names</h2>

          <div style={bodyStyle}>
            <p>
              Predictions are linked to your individual Predictor
              account.
            </p>

            <p>
              Predictor team-name changes are controlled by the
              Administrator.
            </p>

            <p>
              Only predictions successfully saved before the relevant
              deadline will count.
            </p>
          </div>
        </div>

        {/* FAIR PLAY */}

        <div className="card" style={ruleCardStyle}>
          <h2>Fair Play</h2>

          <div style={bodyStyle}>
            <p>
              The Predictor is intended as a fun club competition.
            </p>

            <p>
              The Administrator&apos;s decision will be final in the
              event of any unusual fixture, scoring or account issue not
              specifically covered above.
            </p>
          </div>
        </div>

        <a href="/predictor">
          <button>
            Back to Predictor
          </button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}
