"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PredictionsPage() {
  const router = useRouter();

  const [weeks, setWeeks] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [choices, setChoices] = useState({});
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    async function loadPredictionsPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: weekData, error: weekError } = await supabase
        .from("match_weeks")
        .select("id, week_no, match_date, opens_at, deadline")
        .order("week_no", { ascending: true });

      if (weekError) {
        setMessage(weekError.message);
        setLoading(false);
        return;
      }

      const allWeeks = weekData || [];
      const weekIds = allWeeks.map((week) => week.id);

      if (weekIds.length === 0) {
        setWeeks([]);
        setFixtures([]);
        setLoading(false);
        return;
      }

      const { data: fixtureData, error: fixtureError } = await supabase
        .from("fixtures")
        .select(
          "id, match_week_id, fixture_order, home_team, away_team, scheduled_date, status, result"
        )
        .in("match_week_id", weekIds)
        .order("match_week_id", { ascending: true })
        .order("fixture_order", { ascending: true });

      if (fixtureError) {
        setMessage(fixtureError.message);
        setLoading(false);
        return;
      }

      const fixtureIds = (fixtureData || []).map((fixture) => fixture.id);

      let savedChoices = {};

      if (fixtureIds.length > 0) {
        const { data: predictionData, error: predictionError } = await supabase
          .from("predictions")
          .select("fixture_id, prediction")
          .eq("user_id", user.id)
          .in("fixture_id", fixtureIds);

        if (predictionError) {
          setMessage(predictionError.message);
        } else {
          const reverseMap = {
            home: "H",
            draw: "D",
            away: "A",
          };

          savedChoices = (predictionData || []).reduce(
            (currentChoices, prediction) => {
              currentChoices[prediction.fixture_id] =
                reverseMap[prediction.prediction];

              return currentChoices;
            },
            {}
          );
        }
      }

      const now = new Date();

      const currentOrNextWeek = allWeeks.find(
        (week) => now < new Date(week.deadline)
      );

      const mostRecentClosedWeek = [...allWeeks]
        .reverse()
        .find((week) => now >= new Date(week.deadline));

      setWeeks(allWeeks);
      setFixtures(fixtureData || []);
      setChoices(savedChoices);

      if (currentOrNextWeek) {
        setSelectedWeekId(currentOrNextWeek.id);
      } else if (mostRecentClosedWeek) {
        setSelectedWeekId(mostRecentClosedWeek.id);
      }

      setLoading(false);
    }

    loadPredictionsPage();
  }, [router]);

  async function chooseResult(fixtureId, result, isOpen) {
    if (!isOpen) return;

    const resultMap = {
      H: "home",
      D: "draw",
      A: "away",
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        fixture_id: fixtureId,
        prediction: resultMap[result],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,fixture_id",
      }
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    setChoices((current) => ({
      ...current,
      [fixtureId]: result,
    }));

    setMessage("Prediction saved");

    window.setTimeout(() => {
      setMessage((current) =>
        current === "Prediction saved" ? "" : current
      );
    }, 1200);
  }

  async function clearAllPredictions(weekFixtures, weekNo, isOpen) {
    if (!isOpen) return;

    const confirmed = window.confirm(
      `Clear all predictions for Match Week ${weekNo}?\n\nThis will remove all of your selections for this Match Week.`
    );

    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const fixtureIds = weekFixtures
      .filter((fixture) => fixture.status !== "cancelled")
      .map((fixture) => fixture.id);

    if (fixtureIds.length === 0) {
      setMessage("There are no predictions to clear.");
      return;
    }

    setClearingAll(true);
    setMessage("");

    const { error } = await supabase
      .from("predictions")
      .delete()
      .eq("user_id", user.id)
      .in("fixture_id", fixtureIds);

    if (error) {
      setMessage(error.message);
      setClearingAll(false);
      return;
    }

    setChoices((current) => {
      const updatedChoices = { ...current };

      fixtureIds.forEach((fixtureId) => {
        delete updatedChoices[fixtureId];
      });

      return updatedChoices;
    });

    setMessage(`All predictions cleared for Match Week ${weekNo}.`);
    setClearingAll(false);
  }

  function formatDate(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDeadline(dateString) {
    return new Date(dateString).toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="wowPage">
        <BackgroundFX />

        <div className="pageShell">
          <BrandHeader />

          <div className="loadingCard">
            <div className="loadingDot" />
            Loading fixtures...
          </div>
        </div>

        <Styles />
      </main>
    );
  }

  const selectedWeek = weeks.find(
    (week) => week.id === Number(selectedWeekId)
  );

  const now = new Date();

  const previousWeeks = weeks.filter(
    (week) => now >= new Date(week.deadline)
  );

  const currentAndFutureWeeks = weeks.filter(
    (week) => now < new Date(week.deadline)
  );

  return (
    <main className="wowPage">
      <BackgroundFX />

      <div className="pageShell">
        <BrandHeader />

        {message && (
          <div
            className={`messageBar ${
              message === "Prediction saved" ? "success" : ""
            }`}
          >
            {message === "Prediction saved" ? "✓ Prediction saved" : message}
          </div>
        )}

        <section className="glassCard selectorCard">
          <div className="dualTop" />

          <div className="selectorGrid">
            <div>
              <div className="eyebrow blue">SELECT</div>
              <div className="selectorLabel">MATCH WEEK</div>
            </div>

            <div className="selectWrap">
              <select
                value={selectedWeekId || ""}
                onChange={(e) => setSelectedWeekId(Number(e.target.value))}
              >
                {currentAndFutureWeeks.length > 0 && (
                  <optgroup label="Current / Upcoming">
                    {currentAndFutureWeeks.map((week) => (
                      <option key={week.id} value={week.id}>
                        Match Week {week.week_no}
                      </option>
                    ))}
                  </optgroup>
                )}

                {previousWeeks.length > 0 && (
                  <optgroup label="Previous Weeks">
                    {previousWeeks.map((week) => (
                      <option key={week.id} value={week.id}>
                        Match Week {week.week_no} — Locked
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </section>

        {selectedWeek &&
          (() => {
            const opensAt = new Date(selectedWeek.opens_at);
            const deadline = new Date(selectedWeek.deadline);

            const isOpen = now >= opensAt && now < deadline;
            const notOpenYet = now < opensAt;
            const isLocked = now >= deadline;

            const weekFixtures = fixtures.filter(
              (fixture) =>
                fixture.match_week_id === selectedWeek.id &&
                (isLocked || fixture.status !== "cancelled")
            );

            const activeFixtures = weekFixtures.filter(
              (fixture) => fixture.status !== "cancelled"
            );

            const hasAnyPredictions = activeFixtures.some((fixture) =>
              Boolean(choices[fixture.id])
            );

            const completedPredictionCount = activeFixtures.filter((fixture) =>
              Boolean(choices[fixture.id])
            ).length;

            const allComplete =
              activeFixtures.length > 0 &&
              completedPredictionCount === activeFixtures.length;

            return (
              <section className="glassCard fixturesCard">
                <div className="dualTop" />

                <div className="weekTop">
                  <div>
                    <div className="eyebrow blue">THE PREDICTOR</div>

                    <h1>MATCH WEEK {selectedWeek.week_no}</h1>

                    <div className="weekDate">
                      {formatDate(selectedWeek.match_date)}
                    </div>
                  </div>

                  {!isLocked && (
                    <div
                      className={`selectedCounter ${
                        allComplete ? "complete" : ""
                      }`}
                    >
                      <strong>
                        {completedPredictionCount}/{activeFixtures.length}
                      </strong>

                      <span>SELECTED</span>
                    </div>
                  )}
                </div>

                <div
                  className={`statusBar ${
                    isOpen
                      ? allComplete
                        ? "statusComplete"
                        : "statusOpen"
                      : isLocked
                      ? "statusLocked"
                      : "statusWaiting"
                  }`}
                >
                  <div>
                    <strong>
                      {notOpenYet
                        ? "NOT OPEN YET"
                        : isOpen
                        ? allComplete
                          ? "✓ ALL PREDICTIONS COMPLETE"
                          : "PREDICTIONS OPEN"
                        : "🔒 PREDICTIONS LOCKED"}
                    </strong>

                    <span>
                      {notOpenYet
                        ? `Opens ${formatDeadline(selectedWeek.opens_at)}`
                        : isOpen
                        ? `Closes ${formatDeadline(selectedWeek.deadline)}`
                        : "Selections can no longer be changed"}
                    </span>
                  </div>

                  {isOpen && !allComplete && (
                    <div className="remainingText">
                      {activeFixtures.length - completedPredictionCount} TO GO
                    </div>
                  )}
                </div>

                <div className="fixtureKey">
                  <div>FIXTURE</div>

                  <div className="resultKey">
                    <span>HOME</span>
                    <span>DRAW</span>
                    <span>AWAY</span>
                  </div>
                </div>

                <div className="fixtureList">
                  {weekFixtures.map((fixture, index) => {
                    const selected = choices[fixture.id];
                    const cancelled = fixture.status === "cancelled";

                    if (cancelled && isLocked) {
                      return (
                        <div
                          key={fixture.id}
                          className="cancelledFixture"
                        >
                          <div className="cancelledName">
                            {fixture.home_team} <span>v</span>{" "}
                            {fixture.away_team}
                          </div>

                          <div className="cancelledInfo">
                            <span>Prediction</span>

                            <strong className="cancelledChoice">
                              {selected || "-"}
                            </strong>

                            <b>CANCELLED — no points</b>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={fixture.id}
                        className={`fixtureRow ${
                          selected ? "hasSelection" : ""
                        } ${index % 2 ? "alternate" : ""}`}
                      >
                        <div
                          className="fixtureName"
                          title={`${fixture.home_team} v ${fixture.away_team}`}
                        >
                          <span className="homeTeam">
                            {fixture.home_team}
                          </span>

                          <span className="versus">v</span>

                          <span className="awayTeam">
                            {fixture.away_team}
                          </span>
                        </div>

                        <div className="choiceButtons">
                          {["H", "D", "A"].map((result) => {
                            const isSelected = selected === result;

                            return (
                              <button
                                key={result}
                                type="button"
                                aria-label={
                                  result === "H"
                                    ? "Home win"
                                    : result === "D"
                                    ? "Draw"
                                    : "Away win"
                                }
                                onClick={() =>
                                  chooseResult(fixture.id, result, isOpen)
                                }
                                disabled={!isOpen}
                                className={`choiceButton ${
                                  isSelected ? "selected" : ""
                                } ${!isOpen ? "locked" : ""}`}
                              >
                                {result}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isOpen && allComplete && (
                  <div className="completeBanner">
                    <div className="completeTick">✓</div>

                    <div>
                      <strong>ALL PREDICTIONS COMPLETED</strong>

                      <span>
                        You're all set for Match Week {selectedWeek.week_no}.
                      </span>
                    </div>
                  </div>
                )}

                <div className="bottomActions">
                  {isOpen && (
                    <button
                      type="button"
                      className="clearButton"
                      onClick={() =>
                        clearAllPredictions(
                          weekFixtures,
                          selectedWeek.week_no,
                          isOpen
                        )
                      }
                      disabled={clearingAll || !hasAnyPredictions}
                    >
                      {clearingAll
                        ? "CLEARING..."
                        : "CLEAR ALL PREDICTIONS"}
                    </button>
                  )}

                  <a href="/predictor" className="backButton">
                    ← BACK TO THE PREDICTOR
                  </a>
                </div>
              </section>
            );
          })()}

        {!selectedWeek && (
          <section className="glassCard emptyCard">
            No Match Weeks are currently available.
          </section>
        )}

        <div className="footer">Telford & Wrekin Hockey Club</div>
      </div>

      <Styles />
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="brandHeader">
      <img
        src="/TWHC-badge-white.png"
        alt="Telford & Wrekin Hockey Club"
        className="brandBadge"
      />

      <div>
        <div className="brandTitle">
          THE PREDICTO<span>R</span>
        </div>

        <div className="brandLine" />

        <div className="brandTag">
          <span className="blueWord">PREDICT</span>
          <b>•</b>
          <span>COMPETE</span>
          <b>•</b>
          <span className="redWord">WIN</span>
        </div>

        <div className="pageTag">MAKE YOUR PREDICTIONS</div>
      </div>
    </header>
  );
}

function BackgroundFX() {
  return (
    <>
      <div className="blueGlow" />
      <div className="redGlow" />
      <div className="blueSlash slashOne" />
      <div className="blueSlash slashTwo" />
      <div className="redSlash redOne" />
      <div className="redSlash redTwo" />
    </>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #020c19;
      }

      body {
        overflow-x: hidden;
      }

      button,
      select {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      a {
        text-decoration: none;
      }

      .wowPage {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        color: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        background:
          radial-gradient(
            circle at 8% 18%,
            rgba(0, 116, 255, 0.17),
            transparent 31%
          ),
          radial-gradient(
            circle at 92% 40%,
            rgba(237, 28, 36, 0.11),
            transparent 34%
          ),
          linear-gradient(
            135deg,
            #061b35 0%,
            #031428 38%,
            #050e1c 67%,
            #160c18 100%
          );
      }

      .pageShell {
        position: relative;
        z-index: 5;
        width: min(860px, calc(100% - 30px));
        margin: 0 auto;
        padding: 27px 0 30px;
      }

      /* BACKGROUND */

      .blueGlow,
      .redGlow {
        position: fixed;
        width: 480px;
        height: 480px;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.17;
        pointer-events: none;
      }

      .blueGlow {
        top: 70px;
        left: -220px;
        background: #087eff;
      }

      .redGlow {
        top: 170px;
        right: -220px;
        background: #ed1c24;
      }

      .blueSlash,
      .redSlash {
        position: fixed;
        width: 280px;
        height: 55px;
        transform: skewX(-35deg);
        pointer-events: none;
        opacity: 0.11;
      }

      .blueSlash {
        left: -125px;
        background: linear-gradient(90deg, transparent, #087eff);
      }

      .redSlash {
        right: -125px;
        background: linear-gradient(90deg, #ed1c24, transparent);
      }

      .slashOne {
        top: 19%;
      }

      .slashTwo {
        bottom: 10%;
      }

      .redOne {
        top: 28%;
      }

      .redTwo {
        bottom: 8%;
      }

      /* BRAND */

      .brandHeader {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 13px;
        margin-bottom: 22px;
      }

      .brandBadge {
        display: block;
        width: 62px;
        height: auto;
        filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.42));
      }

      .brandTitle {
        color: #ffffff;
        font-size: 30px;
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -1.6px;
        white-space: nowrap;
        text-shadow: 0 3px 10px rgba(0, 0, 0, 0.45);
      }

      .brandTitle span {
        color: #ed1c24;
        text-shadow: 0 0 15px rgba(237, 28, 36, 0.42);
      }

      .brandLine {
        height: 2px;
        margin-top: 7px;
        background: linear-gradient(
          90deg,
          #087eff,
          transparent 48%,
          #ed1c24
        );
      }

      .brandTag {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 7px;
        color: #edf4fb;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.7px;
      }

      .brandTag b {
        color: #647b92;
      }

      .blueWord {
        color: #2b9cff;
      }

      .redWord {
        color: #ff3040;
      }

      .pageTag {
        margin-top: 5px;
        color: #93a9be;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.3px;
      }

      /* CARDS */

      .glassCard,
      .loadingCard {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(104, 150, 196, 0.38);
        background: linear-gradient(
          155deg,
          rgba(12, 35, 64, 0.96),
          rgba(4, 17, 33, 0.96)
        );
        box-shadow:
          0 17px 42px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.035);
        backdrop-filter: blur(15px);
      }

      .glassCard {
        border-radius: 14px;
      }

      .dualTop {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(
          90deg,
          #087eff 0%,
          #087eff 40%,
          #ed1c24 68%,
          #ed1c24 100%
        );
      }

      /* MESSAGE */

      .messageBar {
        margin-bottom: 12px;
        padding: 10px 14px;
        border: 1px solid rgba(255, 175, 34, 0.42);
        border-radius: 9px;
        background: rgba(116, 67, 0, 0.31);
        color: #ffc45c;
        text-align: center;
        font-size: 12px;
        font-weight: 900;
      }

      .messageBar.success {
        border-color: rgba(46, 199, 116, 0.4);
        background: rgba(15, 105, 57, 0.28);
        color: #67e09b;
      }

      /* SELECTOR */

      .selectorCard {
        margin-bottom: 15px;
        padding: 17px 19px;
      }

      .selectorGrid {
        display: grid;
        grid-template-columns: 130px 1fr;
        align-items: center;
        gap: 15px;
      }

      .eyebrow {
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 1.3px;
      }

      .eyebrow.blue {
        color: #2b9cff;
      }

      .selectorLabel {
        margin-top: 4px;
        color: #ffffff;
        font-size: 17px;
        font-weight: 950;
      }

      .selectWrap {
        position: relative;
      }

      .selectWrap select {
        width: 100%;
        min-height: 48px;
        padding: 10px 42px 10px 14px;
        border: 1px solid rgba(102, 157, 211, 0.48);
        border-radius: 9px;
        outline: none;
        background: #071b34;
        color: #ffffff;
        font-size: 16px;
        font-weight: 850;
        cursor: pointer;
      }

      .selectWrap select:focus {
        border-color: #168eff;
        box-shadow: 0 0 0 3px rgba(22, 142, 255, 0.12);
      }

      .selectWrap option,
      .selectWrap optgroup {
        background: #071b34;
        color: #ffffff;
      }

      /* FIXTURE CARD */

      .fixturesCard {
        padding: 22px 14px 16px;
      }

      .weekTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 6px 15px;
      }

      .weekTop h1 {
        margin: 5px 0 0;
        color: #ffffff;
        font-size: 30px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.8px;
      }

      .weekDate {
        margin-top: 8px;
        color: #9bb1c5;
        font-size: 13px;
        font-weight: 750;
      }

      .selectedCounter {
        flex-shrink: 0;
        min-width: 82px;
        padding: 11px;
        border: 1px solid rgba(57, 136, 215, 0.5);
        border-radius: 11px;
        background: rgba(3, 15, 31, 0.92);
        text-align: center;
        box-shadow:
          inset 0 0 18px rgba(0, 119, 255, 0.08),
          0 6px 18px rgba(0, 0, 0, 0.18);
      }

      .selectedCounter strong {
        display: block;
        color: #ffffff;
        font-size: 21px;
        line-height: 1;
      }

      .selectedCounter span {
        display: block;
        margin-top: 4px;
        color: #9ebad4;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .selectedCounter.complete {
        border-color: rgba(49, 207, 119, 0.55);
        background: rgba(10, 89, 48, 0.42);
        box-shadow: 0 0 22px rgba(39, 202, 111, 0.1);
      }

      /* STATUS */

      .statusBar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 13px;
        padding: 12px 14px;
        border-radius: 9px;
      }

      .statusBar strong {
        display: block;
        font-size: 13px;
        font-weight: 950;
        letter-spacing: 0.3px;
      }

      .statusBar span {
        display: block;
        margin-top: 4px;
        color: #9eb3c8;
        font-size: 11px;
        font-weight: 700;
      }

      .statusOpen {
        border: 1px solid rgba(32, 151, 255, 0.4);
        background: rgba(0, 90, 169, 0.18);
      }

      .statusOpen strong {
        color: #37aaff;
      }

      .statusComplete {
        border: 1px solid rgba(44, 205, 116, 0.43);
        background: rgba(13, 103, 56, 0.25);
      }

      .statusComplete strong {
        color: #62df99;
      }

      .statusWaiting {
        border: 1px solid rgba(242, 170, 44, 0.4);
        background: rgba(113, 69, 0, 0.22);
      }

      .statusWaiting strong {
        color: #ffc04b;
      }

      .statusLocked {
        border: 1px solid rgba(132, 153, 174, 0.32);
        background: rgba(68, 82, 97, 0.18);
      }

      .statusLocked strong {
        color: #aebdcc;
      }

      .remainingText {
        flex-shrink: 0;
        color: #ffb337;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0.5px;
      }

      /* KEY */

      .fixtureKey {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 188px;
        align-items: center;
        gap: 10px;
        padding: 4px 8px 9px;
        color: #7893ad;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.7px;
      }

      .resultKey {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        text-align: center;
      }

      /* FIXTURE ROWS */

      .fixtureList {
        overflow: hidden;
        border-top: 1px solid rgba(103, 139, 174, 0.24);
        border-radius: 3px;
      }

      .fixtureRow {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 188px;
        align-items: center;
        gap: 12px;
        min-height: 72px;
        padding: 10px 8px;
        border-bottom: 1px solid rgba(103, 139, 174, 0.19);
        transition:
          background 0.18s ease,
          border-color 0.18s ease;
      }

      .fixtureRow.alternate {
        background: rgba(255, 255, 255, 0.012);
      }

      .fixtureRow.hasSelection {
        background: linear-gradient(
          90deg,
          rgba(0, 111, 230, 0.045),
          rgba(237, 28, 36, 0.025)
        );
      }

      .fixtureName {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #f1f6fc;
        font-size: 16px;
        line-height: 1.25;
        font-weight: 950;
        letter-spacing: -0.2px;
      }

      .homeTeam,
      .awayTeam {
        color: #f1f6fc;
      }

      .versus {
        margin: 0 6px;
        color: #7089a1;
        font-size: 12px;
        font-weight: 850;
      }

      .choiceButtons {
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-end;
        gap: 10px;
      }

      .choiceButton {
        position: relative;
        width: 54px;
        min-width: 54px;
        height: 48px;
        margin: 0;
        padding: 0;
        border: 1px solid rgba(37, 139, 232, 0.52);
        border-radius: 10px;
        outline: none;
        background: linear-gradient(145deg, #0a3158, #07233f);
        color: #9dd1ff;
        font-size: 14px;
        font-weight: 950;
        cursor: pointer;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.04),
          0 3px 8px rgba(0, 0, 0, 0.18);
        transition:
          transform 0.13s ease,
          filter 0.13s ease,
          box-shadow 0.13s ease;
      }

      .choiceButton:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: #42aaff;
        filter: brightness(1.12);
      }

      .choiceButton.selected {
        border: 1px solid rgba(255, 255, 255, 0.92);
        background: linear-gradient(
          120deg,
          #087eff 0%,
          #405eea 40%,
          #bd286b 70%,
          #ed1c24 100%
        );
        color: #ffffff;
        transform: scale(1.06);
        box-shadow:
          0 0 0 2px rgba(19, 133, 255, 0.25),
          0 0 18px rgba(237, 28, 36, 0.19),
          0 6px 13px rgba(0, 0, 0, 0.3);
      }

      .choiceButton.locked {
        cursor: not-allowed;
        opacity: 0.25;
      }

      .choiceButton.locked.selected {
        opacity: 0.85;
      }

      /* CANCELLED */

      .cancelledFixture {
        padding: 13px 8px;
        border-bottom: 1px solid rgba(103, 139, 174, 0.19);
      }

      .cancelledName {
        color: #d3dee8;
        font-size: 15px;
        font-weight: 900;
      }

      .cancelledName span {
        color: #7089a1;
        font-size: 12px;
      }

      .cancelledInfo {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        color: #778da2;
        font-size: 10px;
        font-weight: 800;
      }

      .cancelledInfo b {
        color: #ff5962;
      }

      .cancelledChoice {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 29px;
        height: 29px;
        border-radius: 50%;
        background: #a31d25;
        color: #ffffff;
      }

      /* COMPLETE */

      .completeBanner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        margin-top: 15px;
        padding: 13px;
        border: 1px solid rgba(48, 204, 118, 0.44);
        border-radius: 10px;
        background: rgba(12, 101, 54, 0.27);
      }

      .completeTick {
        display: grid;
        place-items: center;
        width: 31px;
        height: 31px;
        border-radius: 50%;
        background: #1cb866;
        color: #ffffff;
        font-size: 18px;
        font-weight: 950;
        box-shadow: 0 0 18px rgba(28, 184, 102, 0.2);
      }

      .completeBanner strong {
        display: block;
        color: #62df99;
        font-size: 12px;
        font-weight: 950;
      }

      .completeBanner span {
        display: block;
        margin-top: 2px;
        color: #9dc9b0;
        font-size: 10px;
        font-weight: 700;
      }

      /* ACTIONS */

      .bottomActions {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-top: 16px;
      }

      .clearButton,
      .backButton {
        min-height: 46px;
        border-radius: 9px;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0.3px;
      }

      .clearButton {
        flex: 0 0 44%;
        margin: 0;
        border: 1px solid rgba(237, 28, 36, 0.64);
        background: rgba(130, 18, 25, 0.3);
        color: #ff626a;
        cursor: pointer;
      }

      .clearButton:hover:not(:disabled) {
        background: rgba(184, 22, 31, 0.45);
        color: #ffffff;
      }

      .clearButton:disabled {
        opacity: 0.28;
        cursor: not-allowed;
      }

      .backButton {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(75, 150, 221, 0.43);
        background: linear-gradient(
          105deg,
          #087eff 0%,
          #405eea 40%,
          #bd286b 70%,
          #ed1c24 100%
        );
        color: #ffffff;
      }

      .backButton:hover {
        filter: brightness(1.08);
      }

      /* MISC */

      .footer {
        margin-top: 22px;
        text-align: center;
        color: #647b91;
        font-size: 10px;
      }

      .emptyCard {
        padding: 25px;
        text-align: center;
        color: #a7bacd;
        font-size: 13px;
        font-weight: 700;
      }

      .loadingCard {
        width: min(460px, 100%);
        margin: 55px auto;
        padding: 28px;
        border-radius: 14px;
        text-align: center;
        color: #afc4d7;
        font-size: 13px;
        font-weight: 800;
      }

      .loadingDot {
        width: 11px;
        height: 11px;
        margin: 0 auto 12px;
        border-radius: 50%;
        background: #168eff;
        box-shadow: 0 0 18px #168eff;
        animation: pulse 1.1s infinite ease-in-out;
      }

      @keyframes pulse {
        50% {
          opacity: 0.35;
          transform: scale(0.72);
        }
      }

      /* MOBILE */

      @media (max-width: 620px) {
        .pageShell {
          width: calc(100% - 16px);
          padding-top: 16px;
        }

        .brandHeader {
          margin-bottom: 17px;
          gap: 10px;
        }

        .brandBadge {
          width: 50px;
        }

        .brandTitle {
          font-size: 24px;
          letter-spacing: -1.2px;
        }

        .brandTag {
          gap: 6px;
          font-size: 7px;
          letter-spacing: 1.15px;
        }

        .pageTag {
          font-size: 7px;
        }

        .selectorCard {
          padding: 14px 12px;
        }

        .selectorGrid {
          grid-template-columns: 96px 1fr;
          gap: 9px;
        }

        .selectorLabel {
          font-size: 14px;
        }

        .selectWrap select {
          min-height: 43px;
          padding-left: 10px;
          font-size: 14px;
        }

        .fixturesCard {
          padding: 18px 7px 12px;
        }

        .weekTop {
          padding: 0 5px 13px;
        }

        .weekTop h1 {
          font-size: 25px;
        }

        .weekDate {
          font-size: 11px;
        }

        .selectedCounter {
          min-width: 68px;
          padding: 8px;
        }

        .selectedCounter strong {
          font-size: 17px;
        }

        .selectedCounter span {
          font-size: 7px;
        }

        .statusBar {
          margin-right: 2px;
          margin-left: 2px;
          padding: 10px;
        }

        .statusBar strong {
          font-size: 10px;
        }

        .statusBar span {
          font-size: 9px;
        }

        .remainingText {
          font-size: 9px;
        }

        .fixtureKey {
          grid-template-columns: minmax(0, 1fr) 138px;
          gap: 5px;
          padding-right: 4px;
          padding-left: 5px;
          font-size: 7px;
        }

        .fixtureRow {
          grid-template-columns: minmax(0, 1fr) 138px;
          gap: 6px;
          min-height: 64px;
          padding: 8px 5px;
        }

        .fixtureName {
          padding-right: 3px;
          font-size: 14px;
          line-height: 1.2;
          font-weight: 950;
        }

        .versus {
          margin: 0 3px;
          font-size: 10px;
        }

        .choiceButtons {
          gap: 6px;
        }

        .choiceButton {
          width: 42px;
          min-width: 42px;
          height: 42px;
          border-radius: 9px;
          font-size: 12px;
        }

        .cancelledName {
          font-size: 13px;
        }

        .bottomActions {
          flex-direction: column;
          gap: 8px;
          margin: 13px 2px 0;
        }

        .clearButton,
        .backButton {
          width: 100%;
          min-height: 43px;
          flex: none;
        }

        .completeBanner {
          margin-right: 2px;
          margin-left: 2px;
        }
      }

      @media (max-width: 390px) {
        .brandTitle {
          font-size: 22px;
        }

        .brandBadge {
          width: 46px;
        }

        .fixtureKey,
        .fixtureRow {
          grid-template-columns: minmax(0, 1fr) 126px;
        }

        .choiceButtons {
          gap: 4px;
        }

        .choiceButton {
          width: 39px;
          min-width: 39px;
          height: 40px;
        }

        .fixtureName {
          font-size: 13px;
        }
      }
    `}</style>
  );
}
