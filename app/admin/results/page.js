"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [authorised, setAuthorised] = useState(false);

  useEffect(() => {
    async function loadAdmin() {
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

      if (profileError || !profile || profile.role !== "admin") {
        setMessage(
          "You do not have permission to access the Admin area."
        );
        setLoading(false);
        return;
      }

      setAuthorised(true);

      const { data: weekData, error: weekError } = await supabase
        .from("match_weeks")
        .select("id, week_no, match_date")
        .order("week_no", { ascending: true });

      if (weekError) {
        setMessage(weekError.message);
        setLoading(false);
        return;
      }

      setWeeks(weekData || []);

      if (weekData && weekData.length > 0) {
        setSelectedWeekId(weekData[0].id);
      }

      setLoading(false);
    }

    loadAdmin();
  }, [router]);

  useEffect(() => {
    if (!authorised || !selectedWeekId) return;

    async function loadFixtures() {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("fixtures")
        .select(
          "id, fixture_order, home_team, away_team, scheduled_date, result, status"
        )
        .eq("match_week_id", selectedWeekId)
        .order("fixture_order", { ascending: true });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setFixtures(data || []);
      setLoading(false);
    }

    loadFixtures();
  }, [selectedWeekId, authorised]);

  async function saveResult(fixtureId, result) {
    setSavingId(fixtureId);
    setMessage("");

    const resultMap = {
      H: "home",
      D: "draw",
      A: "away",
    };

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: resultMap[result],
        result_recorded_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: resultMap[result],
              status: "completed",
            }
          : fixture
      )
    );

    setMessage("Result saved.");
    setSavingId(null);
  }

  async function clearResult(fixtureId) {
    setSavingId(fixtureId);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: null,
        result_recorded_at: null,
        status: "scheduled",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: null,
              status: "scheduled",
            }
          : fixture
      )
    );

    setMessage("Result cleared.");
    setSavingId(null);
  }

  async function cancelFixture(fixtureId) {
    const confirmed = window.confirm(
      "Mark this fixture as cancelled?\n\nNo points will be awarded for this fixture."
    );

    if (!confirmed) return;

    setSavingId(fixtureId);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: null,
        result_recorded_at: null,
        status: "cancelled",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: null,
              status: "cancelled",
            }
          : fixture
      )
    );

    setMessage("Fixture marked as cancelled.");
    setSavingId(null);
  }

  async function restoreFixture(fixtureId) {
    const confirmed = window.confirm(
      "Restore this fixture to the active fixture list?"
    );

    if (!confirmed) return;

    setSavingId(fixtureId);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: null,
        result_recorded_at: null,
        status: "scheduled",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: null,
              status: "scheduled",
            }
          : fixture
      )
    );

    setMessage("Fixture restored.");
    setSavingId(null);
  }

  function displayResult(result) {
    if (result === "home") return "H";
    if (result === "draw") return "D";
    if (result === "away") return "A";
    return null;
  }

  function formatDate(dateString) {
    if (!dateString) return "";

    return new Date(`${dateString}T12:00:00`).toLocaleDateString(
      "en-GB",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function Header() {
    return (
      <div className="brandHeader">
        <div className="brandGlow brandGlowBlue" />
        <div className="brandGlow brandGlowRed" />

        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="brandBadge"
        />

        <div className="brandCopy">
          <div className="brandTitle">
            THE PREDICTO<span>R</span>
          </div>

          <div className="brandLabel">ADMIN — ENTER RESULTS</div>
        </div>
      </div>
    );
  }

  if (loading && !authorised) {
    return (
      <main>
        <div className="container resultsShell">
          <Header />

          <div className="loadingCard">
            <div className="loadingPulse" />
            <p>Loading Admin area...</p>
          </div>
        </div>

        <PageStyles />
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container resultsShell">
          <Header />

          <section className="pageHero">
            <div className="heroLine" />
            <div className="heroEyebrow">COMPETITION CONTROL</div>
            <h1>Enter Results</h1>
          </section>

          <div className="accessCard">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a href="/predictor" className="backLink">
            <button className="backButton">
              ← Back to Predictor
            </button>
          </a>
        </div>

        <PageStyles />
      </main>
    );
  }

  const selectedWeek = weeks.find(
    (week) => week.id === Number(selectedWeekId)
  );

  const completedCount = fixtures.filter(
    (fixture) =>
      fixture.result && fixture.status !== "cancelled"
  ).length;

  const cancelledCount = fixtures.filter(
    (fixture) => fixture.status === "cancelled"
  ).length;

  const activeCount = fixtures.filter(
    (fixture) => fixture.status !== "cancelled"
  ).length;

  const awaitingCount = fixtures.filter(
    (fixture) =>
      fixture.status !== "cancelled" && !fixture.result
  ).length;

  return (
    <main>
      <div className="container resultsShell">
        <Header />

        <section className="pageHero">
          <div className="heroLine" />

          <div className="heroEyebrow">
            THE PREDICTOR CONTROL CENTRE
          </div>

          <h1>Enter Results</h1>

          <p>
            Record each fixture as Home, Draw or Away
          </p>

          <div className="heroRule">
            <span className="blueRule" />
            <span className="centreDot" />
            <span className="redRule" />
          </div>
        </section>

        {message && (
          <div
            className={`messageBar ${
              message.toLowerCase().includes("saved") ||
              message.toLowerCase().includes("cleared") ||
              message.toLowerCase().includes("restored")
                ? "success"
                : message.toLowerCase().includes("cancelled")
                ? "danger"
                : "warning"
            }`}
          >
            <span>
              {message.toLowerCase().includes("saved") ||
              message.toLowerCase().includes("cleared") ||
              message.toLowerCase().includes("restored")
                ? "✓"
                : "ⓘ"}
            </span>

            {message}
          </div>
        )}

        <section className="weekPanel">
          <div className="weekPanelTop">
            <div>
              <div className="sectionEyebrow">MATCH WEEK</div>
              <h2>Select Match Week</h2>
            </div>

            <div className="livePill">LIVE CONTROL</div>
          </div>

          <select
            className="weekSelect"
            value={selectedWeekId}
            onChange={(e) =>
              setSelectedWeekId(Number(e.target.value))
            }
          >
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>
                Match Week {week.week_no}
              </option>
            ))}
          </select>

          {selectedWeek?.match_date && (
            <div className="selectedWeekStrip">
              <span className="weekDot" />

              Match Week {selectedWeek.week_no} ·{" "}
              {formatDate(selectedWeek.match_date)}
            </div>
          )}
        </section>

        <section className="resultsPanel">
          <div className="resultsHeading">
            <div>
              <div className="sectionEyebrow">
                RECORD RESULTS
              </div>

              <h2>
                Match Week {selectedWeek?.week_no}
              </h2>

              {selectedWeek?.match_date && (
                <div className="weekDate">
                  {formatDate(selectedWeek.match_date)}
                </div>
              )}
            </div>
          </div>

          {!loading && fixtures.length > 0 && (
            <div className="summaryGrid">
              <div className="summaryCard active">
                <strong>{activeCount}</strong>
                <span>ACTIVE</span>
              </div>

              <div className="summaryCard complete">
                <strong>{completedCount}</strong>
                <span>RESULTS IN</span>
              </div>

              <div className="summaryCard waiting">
                <strong>{awaitingCount}</strong>
                <span>AWAITING</span>
              </div>

              <div className="summaryCard cancelled">
                <strong>{cancelledCount}</strong>
                <span>CANCELLED</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loadingInline">
              <div className="loadingPulse" />
              <p>Loading fixtures...</p>
            </div>
          ) : fixtures.length === 0 ? (
            <div className="emptyCard">
              <div className="emptyIcon">🏑</div>
              <h3>No Fixtures Found</h3>
              <p>
                There are no fixtures for this Match Week.
              </p>
            </div>
          ) : (
            <div className="fixturesList">
              {fixtures.map((fixture, index) => {
                const selected = displayResult(fixture.result);
                const saving = savingId === fixture.id;
                const cancelled =
                  fixture.status === "cancelled";

                return (
                  <div
                    key={fixture.id}
                    className={`resultFixture ${
                      cancelled
                        ? "fixtureCancelled"
                        : index % 2 === 0
                        ? "fixtureBlue"
                        : "fixtureRed"
                    }`}
                  >
                    <div className="fixtureTopLine" />

                    <div className="fixtureMain">
                      <div className="fixtureInfo">
                        <div className="fixtureMeta">
                          <span>
                            FIXTURE {fixture.fixture_order}
                          </span>

                          {fixture.scheduled_date && (
                            <span>
                              {formatDate(
                                fixture.scheduled_date
                              )}
                            </span>
                          )}
                        </div>

                        <div
                          className={`fixtureName ${
                            cancelled ? "cancelledName" : ""
                          }`}
                          title={`${fixture.home_team} v ${fixture.away_team}`}
                        >
                          <span className="homeTeam">
                            {fixture.home_team}
                          </span>

                          <span className="versus">V</span>

                          <span className="awayTeam">
                            {fixture.away_team}
                          </span>
                        </div>
                      </div>

                      {!cancelled ? (
                        <div className="resultButtons">
                          {["H", "D", "A"].map((result) => {
                            const isSelected =
                              selected === result;

                            return (
                              <button
                                key={result}
                                disabled={saving}
                                onClick={() =>
                                  saveResult(
                                    fixture.id,
                                    result
                                  )
                                }
                                className={`resultButton ${
                                  isSelected
                                    ? "selectedResult"
                                    : ""
                                }`}
                              >
                                {result}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="cancelledBadge">
                          CANCELLED
                        </div>
                      )}
                    </div>

                    <div className="fixtureBottom">
                      {!cancelled && fixture.result ? (
                        <div className="recordedResult">
                          <span className="recordedDot" />

                          Result recorded:{" "}
                          <strong>
                            {fixture.result === "home"
                              ? "HOME WIN"
                              : fixture.result === "draw"
                              ? "DRAW"
                              : "AWAY WIN"}
                          </strong>
                        </div>
                      ) : !cancelled ? (
                        <div className="awaitingResult">
                          <span className="awaitingDot" />
                          Awaiting result
                        </div>
                      ) : (
                        <div className="cancelledText">
                          No points will be awarded
                        </div>
                      )}

                      <div className="adminActions">
                        {!cancelled && fixture.result && (
                          <button
                            disabled={saving}
                            onClick={() =>
                              clearResult(fixture.id)
                            }
                            className="actionButton clearButton"
                          >
                            Clear Result
                          </button>
                        )}

                        {!cancelled && (
                          <button
                            disabled={saving}
                            onClick={() =>
                              cancelFixture(fixture.id)
                            }
                            className="actionButton cancelButton"
                          >
                            Cancel Fixture
                          </button>
                        )}

                        {cancelled && (
                          <button
                            disabled={saving}
                            onClick={() =>
                              restoreFixture(fixture.id)
                            }
                            className="actionButton restoreButton"
                          >
                            Restore Fixture
                          </button>
                        )}
                      </div>
                    </div>

                    {saving && (
                      <div className="savingOverlay">
                        SAVING...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <a href="/admin" className="backLink">
          <button className="backButton">
            ← Back to Admin
          </button>
        </a>

        <p className="pageFooter">
          Telford & Wrekin Hockey Club
        </p>
      </div>

      <PageStyles />
    </main>
  );
}

function PageStyles() {
  return (
    <style jsx global>{`
      .resultsShell {
        max-width: 820px !important;
        padding-bottom: 28px;
      }

      .brandHeader {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: fit-content;
        max-width: 100%;
        margin: 0 auto 14px;
        padding: 7px 14px;
      }

      .brandGlow {
        position: absolute;
        top: 50%;
        width: 80px;
        height: 44px;
        border-radius: 50%;
        filter: blur(23px);
        opacity: 0.34;
        pointer-events: none;
      }

      .brandGlowBlue {
        left: -18px;
        background: #087eff;
      }

      .brandGlowRed {
        right: -20px;
        background: #ed1c24;
      }

      .brandBadge {
        position: relative;
        z-index: 1;
        display: block;
        width: 60px;
        height: auto;
        margin: 0;
        filter:
          drop-shadow(0 0 10px rgba(0, 125, 255, 0.24))
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.42));
      }

      .brandCopy {
        position: relative;
        z-index: 1;
        text-align: left;
      }

      .brandTitle {
        color: #ffffff;
        font-size: 28px;
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -1.3px;
        white-space: nowrap;
        text-shadow:
          0 2px 8px rgba(0, 0, 0, 0.45),
          0 0 12px rgba(255, 255, 255, 0.08);
      }

      .brandTitle span {
        color: #ed1c24;
        text-shadow: 0 0 14px rgba(237, 28, 36, 0.46);
      }

      .brandLabel {
        margin-top: 6px;
        color: #a9bfd5;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 1.5px;
      }

      .pageHero {
        position: relative;
        overflow: hidden;
        margin-bottom: 12px;
        padding: 18px 18px 16px;
        border: 1px solid rgba(72, 145, 215, 0.34);
        border-radius: 15px;
        text-align: center;
        background:
          radial-gradient(
            circle at 4% 10%,
            rgba(0, 121, 255, 0.18),
            transparent 33%
          ),
          radial-gradient(
            circle at 96% 82%,
            rgba(237, 28, 36, 0.15),
            transparent 34%
          ),
          linear-gradient(
            145deg,
            rgba(8, 30, 56, 0.97),
            rgba(3, 12, 25, 0.99)
          );
        box-shadow:
          -7px 0 24px rgba(0, 105, 255, 0.08),
          7px 0 24px rgba(237, 28, 36, 0.07),
          0 15px 34px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.035);
      }

      .heroLine {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(
          90deg,
          #087eff 0 42%,
          #d7e8f8 50%,
          #ed1c24 58% 100%
        );
      }

      .heroEyebrow,
      .sectionEyebrow {
        color: #2999ff;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.7px;
      }

      .pageHero h1 {
        margin: 4px 0 0;
        color: #ffffff;
        font-size: 25px;
        line-height: 1.05;
        font-weight: 950;
        letter-spacing: -0.6px;
      }

      .pageHero p {
        margin: 6px 0 0;
        color: #9eb6cd;
        font-size: 12px;
        font-weight: 750;
      }

      .heroRule {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        width: min(330px, 80%);
        margin: 12px auto 0;
      }

      .blueRule,
      .redRule {
        flex: 1;
        height: 2px;
      }

      .blueRule {
        background: linear-gradient(
          90deg,
          transparent,
          #168cff
        );
      }

      .redRule {
        background: linear-gradient(
          90deg,
          #ed1c24,
          transparent
        );
      }

      .centreDot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.65);
      }

      .weekPanel,
      .resultsPanel {
        position: relative;
        margin-bottom: 12px;
        border-radius: 13px;
        background:
          radial-gradient(
            circle at 0 0,
            rgba(0, 119, 255, 0.1),
            transparent 35%
          ),
          linear-gradient(
            145deg,
            rgba(7, 28, 53, 0.98),
            rgba(3, 14, 28, 0.99)
          );
        box-shadow:
          0 12px 26px rgba(0, 0, 0, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }

      .weekPanel {
        padding: 14px;
        border: 1px solid rgba(46, 133, 218, 0.48);
      }

      .resultsPanel {
        padding: 14px;
        border: 1px solid rgba(67, 130, 190, 0.38);
      }

      .weekPanelTop,
      .resultsHeading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 9px;
      }

      .weekPanel h2,
      .resultsHeading h2 {
        margin: 2px 0 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 950;
      }

      .weekDate {
        margin-top: 3px;
        color: #8ca6bd;
        font-size: 10px;
        font-weight: 750;
      }

      .livePill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 24px;
        padding: 0 9px;
        border: 1px solid rgba(38, 145, 247, 0.5);
        border-radius: 999px;
        background: rgba(5, 71, 130, 0.24);
        color: #55aeff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .weekSelect {
        width: 100%;
        min-height: 43px;
        padding: 0 12px;
        border: 1px solid rgba(74, 151, 224, 0.62);
        border-radius: 9px;
        outline: none;
        background: #071a31;
        color: #ffffff;
        font-size: 13px;
        font-weight: 850;
      }

      .weekSelect:focus {
        border-color: #2999ff;
        box-shadow: 0 0 0 2px rgba(41, 153, 255, 0.12);
      }

      .selectedWeekStrip {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 9px;
        color: #93abc1;
        font-size: 10px;
        font-weight: 800;
      }

      .weekDot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #168cff;
        box-shadow: 0 0 8px rgba(22, 140, 255, 0.7);
      }

      .messageBar {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 9px;
        font-size: 11px;
        font-weight: 850;
      }

      .messageBar.success {
        border: 1px solid rgba(50, 194, 115, 0.48);
        background: rgba(19, 104, 59, 0.2);
        color: #8ee5b5;
      }

      .messageBar.warning {
        border: 1px solid rgba(240, 165, 40, 0.45);
        background: rgba(117, 74, 10, 0.2);
        color: #ffd181;
      }

      .messageBar.danger {
        border: 1px solid rgba(237, 49, 58, 0.5);
        background: rgba(126, 14, 22, 0.22);
        color: #ff9298;
      }

      .summaryGrid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 7px;
        margin-bottom: 12px;
      }

      .summaryCard {
        padding: 9px 4px 8px;
        border-radius: 8px;
        text-align: center;
      }

      .summaryCard strong {
        display: block;
        color: #ffffff;
        font-size: 18px;
        line-height: 1;
        font-weight: 950;
      }

      .summaryCard span {
        display: block;
        margin-top: 4px;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.6px;
      }

      .summaryCard.active {
        border: 1px solid rgba(40, 145, 244, 0.4);
        background: rgba(9, 69, 126, 0.42);
        color: #8bc9ff;
      }

      .summaryCard.complete {
        border: 1px solid rgba(47, 191, 110, 0.4);
        background: rgba(15, 103, 56, 0.4);
        color: #9be0b9;
      }

      .summaryCard.waiting {
        border: 1px solid rgba(255, 170, 36, 0.4);
        background: rgba(120, 74, 9, 0.35);
        color: #ffd078;
      }

      .summaryCard.cancelled {
        border: 1px solid rgba(237, 49, 58, 0.4);
        background: rgba(121, 17, 24, 0.35);
        color: #ff8a91;
      }

      .fixturesList {
        display: grid;
        gap: 8px;
      }

      .resultFixture {
        position: relative;
        overflow: hidden;
        padding: 11px;
        border-radius: 10px;
        background: linear-gradient(
          145deg,
          rgba(5, 24, 45, 0.98),
          rgba(3, 14, 27, 0.98)
        );
        box-shadow:
          0 8px 18px rgba(0, 0, 0, 0.23),
          inset 0 1px 0 rgba(255, 255, 255, 0.025);
      }

      .fixtureBlue {
        border: 1px solid rgba(36, 138, 238, 0.4);
      }

      .fixtureRed {
        border: 1px solid rgba(230, 45, 53, 0.36);
      }

      .fixtureCancelled {
        border: 1px solid rgba(150, 160, 170, 0.23);
        background: linear-gradient(
          145deg,
          rgba(27, 32, 39, 0.96),
          rgba(15, 19, 24, 0.98)
        );
        opacity: 0.88;
      }

      .fixtureTopLine {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
      }

      .fixtureBlue .fixtureTopLine {
        background: linear-gradient(
          90deg,
          #087eff,
          transparent 72%
        );
      }

      .fixtureRed .fixtureTopLine {
        background: linear-gradient(
          90deg,
          transparent 28%,
          #ed1c24
        );
      }

      .fixtureCancelled .fixtureTopLine {
        background: linear-gradient(
          90deg,
          transparent,
          #7c8a98,
          transparent
        );
      }

      .fixtureMain {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 150px;
        align-items: center;
        gap: 10px;
      }

      .fixtureInfo {
        min-width: 0;
      }

      .fixtureMeta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        color: #6988a5;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.6px;
        text-transform: uppercase;
      }

      .fixtureName {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr);
        align-items: center;
        gap: 5px;
        min-width: 0;
        color: #ffffff;
        font-size: 13px;
        font-weight: 900;
      }

      .homeTeam,
      .awayTeam {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .homeTeam {
        text-align: right;
      }

      .awayTeam {
        text-align: left;
      }

      .versus {
        color: #829ab0;
        text-align: center;
        font-size: 9px;
        font-weight: 950;
      }

      .cancelledName {
        color: #7d8995;
        text-decoration: line-through;
      }

      .resultButtons {
        display: grid;
        grid-template-columns: repeat(3, 44px);
        justify-content: end;
        gap: 6px;
      }

      .resultButton {
        width: 44px;
        height: 44px;
        margin: 0;
        padding: 0;
        border: 1px solid rgba(32, 137, 236, 0.62);
        border-radius: 50%;
        background: linear-gradient(
          145deg,
          #087bd4,
          #075ca4
        );
        color: #ffffff;
        font-size: 13px;
        font-weight: 950;
        box-shadow:
          0 3px 0 #04477f,
          0 5px 10px rgba(0, 0, 0, 0.18);
        cursor: pointer;
      }

      .resultButton:hover {
        transform: translateY(-1px);
      }

      .resultButton.selectedResult {
        border: 2px solid #ffffff;
        background: linear-gradient(
          145deg,
          #f12a33,
          #b90f18
        );
        outline: 2px solid #ed1c24;
        box-shadow:
          0 0 14px rgba(237, 28, 36, 0.4),
          0 3px 0 #800910;
      }

      .resultButton:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .cancelledBadge {
        justify-self: end;
        padding: 7px 10px;
        border: 1px solid rgba(237, 49, 58, 0.45);
        border-radius: 999px;
        background: rgba(117, 17, 24, 0.27);
        color: #ff777e;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.7px;
      }

      .fixtureBottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 9px;
        padding-top: 8px;
        border-top: 1px solid rgba(100, 139, 176, 0.13);
      }

      .recordedResult,
      .awaitingResult,
      .cancelledText {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #7892aa;
        font-size: 8px;
        font-weight: 800;
      }

      .recordedResult {
        color: #79dca4;
      }

      .recordedResult strong {
        color: #a6ebc3;
      }

      .recordedDot,
      .awaitingDot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .recordedDot {
        background: #35cf79;
        box-shadow: 0 0 7px rgba(53, 207, 121, 0.55);
      }

      .awaitingDot {
        background: #f2a822;
        box-shadow: 0 0 7px rgba(242, 168, 34, 0.45);
      }

      .adminActions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
      }

      .actionButton {
        width: auto;
        min-height: 30px;
        margin: 0;
        padding: 0 9px;
        border: none;
        border-radius: 6px;
        color: #ffffff;
        font-size: 8px;
        font-weight: 900;
        cursor: pointer;
      }

      .clearButton {
        background: linear-gradient(
          145deg,
          #586d80,
          #405366
        );
        box-shadow: 0 2px 0 #2c3c4b;
      }

      .cancelButton {
        background: linear-gradient(
          145deg,
          #e3262f,
          #ad0d15
        );
        box-shadow: 0 2px 0 #76070c;
      }

      .restoreButton {
        background: linear-gradient(
          145deg,
          #19844a,
          #116336
        );
        box-shadow: 0 2px 0 #0a4625;
      }

      .savingOverlay {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(2, 10, 19, 0.65);
        color: #ffffff;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 1px;
        backdrop-filter: blur(1px);
      }

      .loadingCard,
      .loadingInline,
      .emptyCard,
      .accessCard {
        padding: 20px;
        color: #ffffff;
        text-align: center;
      }

      .loadingCard,
      .accessCard {
        margin: 12px 0;
        border: 1px solid rgba(57, 137, 214, 0.42);
        border-radius: 13px;
        background: linear-gradient(
          145deg,
          rgba(7, 29, 55, 0.97),
          rgba(3, 14, 28, 0.99)
        );
      }

      .emptyCard {
        border: 1px solid rgba(62, 124, 183, 0.25);
        border-radius: 10px;
        background: rgba(3, 16, 30, 0.55);
      }

      .loadingCard p,
      .loadingInline p,
      .emptyCard p,
      .accessCard p {
        margin: 6px 0 0;
        color: #9eb4c9;
        font-size: 11px;
      }

      .emptyCard h3,
      .accessCard h2 {
        margin: 5px 0 0;
      }

      .emptyIcon {
        font-size: 32px;
      }

      .loadingPulse {
        width: 12px;
        height: 12px;
        margin: 0 auto 8px;
        border-radius: 50%;
        background: #168cff;
        box-shadow: 0 0 14px rgba(22, 140, 255, 0.75);
        animation: resultsPulse 1.2s infinite ease-in-out;
      }

      @keyframes resultsPulse {
        0%,
        100% {
          opacity: 0.35;
          transform: scale(0.8);
        }

        50% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .backLink {
        display: block;
        margin-top: 14px;
        text-decoration: none;
      }

      .backButton {
        width: 100%;
        min-height: 42px;
        margin: 0;
        border: none;
        border-radius: 9px;
        background: linear-gradient(
          105deg,
          #087eff,
          #155fb8
        );
        color: #ffffff;
        font-size: 10px;
        font-weight: 950;
        box-shadow:
          0 3px 0 #06417e,
          0 6px 12px rgba(0, 0, 0, 0.16);
      }

      .pageFooter {
        margin: 15px 0 0;
        color: #607b94;
        text-align: center;
        font-size: 9px;
        font-weight: 750;
      }

      @media (max-width: 700px) {
        .resultsShell {
          padding-bottom: 20px;
        }

        .brandHeader {
          margin-bottom: 8px;
          padding: 4px 8px;
          gap: 9px;
        }

        .brandBadge {
          width: 49px;
        }

        .brandTitle {
          font-size: 23px;
          letter-spacing: -1px;
        }

        .brandLabel {
          margin-top: 4px;
          font-size: 8px;
          letter-spacing: 1.1px;
        }

        .pageHero {
          margin-bottom: 10px;
          padding: 13px 10px 11px;
        }

        .heroEyebrow {
          font-size: 7px;
          letter-spacing: 1.3px;
        }

        .pageHero h1 {
          font-size: 20px;
        }

        .pageHero p {
          font-size: 9px;
        }

        .heroRule {
          margin-top: 8px;
        }

        .weekPanel,
        .resultsPanel {
          padding: 10px;
        }

        .weekPanel h2,
        .resultsHeading h2 {
          font-size: 15px;
        }

        .sectionEyebrow {
          font-size: 7px;
        }

        .livePill {
          min-height: 21px;
          padding: 0 7px;
          font-size: 6px;
        }

        .weekSelect {
          min-height: 39px;
          font-size: 11px;
        }

        .selectedWeekStrip,
        .weekDate {
          font-size: 8px;
        }

        .summaryGrid {
          gap: 5px;
        }

        .summaryCard {
          padding: 7px 2px;
        }

        .summaryCard strong {
          font-size: 15px;
        }

        .summaryCard span {
          font-size: 6px;
          letter-spacing: 0.25px;
        }

        .fixturesList {
          gap: 7px;
        }

        .resultFixture {
          padding: 9px;
        }

        .fixtureMain {
          grid-template-columns: minmax(0, 1fr) 123px;
          gap: 6px;
        }

        .fixtureMeta {
          font-size: 6px;
        }

        .fixtureName {
          grid-template-columns: minmax(0, 1fr) 16px minmax(0, 1fr);
          gap: 3px;
          font-size: 10px;
        }

        .versus {
          font-size: 7px;
        }

        .resultButtons {
          grid-template-columns: repeat(3, 37px);
          gap: 4px;
        }

        .resultButton {
          width: 37px;
          height: 37px;
          font-size: 11px;
        }

        .fixtureBottom {
          align-items: flex-start;
          margin-top: 7px;
          padding-top: 7px;
        }

        .recordedResult,
        .awaitingResult,
        .cancelledText {
          font-size: 7px;
        }

        .adminActions {
          gap: 4px;
        }

        .actionButton {
          min-height: 27px;
          padding: 0 7px;
          font-size: 7px;
        }

        .cancelledBadge {
          padding: 6px 8px;
          font-size: 7px;
        }

        .messageBar {
          padding: 8px 10px;
          font-size: 9px;
        }

        .backButton {
          min-height: 38px;
          font-size: 9px;
        }
      }

      @media (max-width: 440px) {
        .fixtureBottom {
          display: block;
        }

        .adminActions {
          margin-top: 7px;
        }

        .fixtureMain {
          grid-template-columns: minmax(0, 1fr) 117px;
        }

        .resultButtons {
          grid-template-columns: repeat(3, 35px);
          gap: 4px;
        }

        .resultButton {
          width: 35px;
          height: 35px;
        }
      }

      @media (max-width: 370px) {
        .fixtureMain {
          grid-template-columns: minmax(0, 1fr) 105px;
        }

        .resultButtons {
          grid-template-columns: repeat(3, 31px);
          gap: 4px;
        }

        .resultButton {
          width: 31px;
          height: 31px;
          font-size: 10px;
        }

        .fixtureName {
          font-size: 9px;
        }
      }
    `}</style>
  );
}
