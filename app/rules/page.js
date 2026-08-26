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

  return (
    <main className="wowPage">
      <BackgroundFX />

      <div className="pageShell">
        <BrandHeader />

        <div className="intro">
          Everything you need to know about playing The Predictor.
        </div>

        {/* =====================================================
            ENTRY & PRIZES
        ===================================================== */}

        <RuleCard
          eyebrow="ENTRY & PRIZES"
          title="Entry Fee & Prize Money"
          featured
        >
          {loadingSettings ? (
            <p>Loading competition details...</p>
          ) : (
            <>
              <div className="entryFeeHero">
                <div>
                  <div className="miniLabel">ENTRY FEE</div>

                  <div className="entryAmount">
                    {formatMoney(settings.entry_fee)}
                  </div>

                  <div className="entrySub">
                    One entry. One season. Become The Predictor.
                  </div>
                </div>

                <div className="entryIcon">£</div>
              </div>

              <div className="paymentGrid">
                <div className="infoPanel bluePanel">
                  <div className="infoIcon">📱</div>

                  <div>
                    <strong>Pay via Teamo</strong>

                    <p>
                      The entry fee can be paid via the{" "}
                      <b>Telford & Wrekin HC Teamo app</b>.
                    </p>
                  </div>
                </div>

                <div className="infoPanel redPanel">
                  <div className="infoIcon">💳</div>

                  <div>
                    <strong>Not registered on Teamo?</strong>

                    <p>
                      Payment can also be made at the{" "}
                      <b>hockey pitch café</b> via <b>SumUp</b>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="prizeGrid">
                <div className="prizeCard gold">
                  <div className="medal">🏆</div>

                  <div>
                    <div className="prizeLabel">1ST PRIZE</div>

                    <div className="prizeAmount">
                      {formatMoney(settings.first_prize)}
                    </div>
                  </div>
                </div>

                <div className="prizeCard silver">
                  <div className="medal">🥈</div>

                  <div>
                    <div className="prizeLabel">2ND PRIZE</div>

                    <div className="prizeAmount">
                      {formatMoney(settings.second_prize)}
                    </div>
                  </div>
                </div>
              </div>

              <p>
                Prize amounts will be confirmed once the prize fund has been
                finalised.
              </p>

              <p>
                If two or more entrants are tied for 1st place, the 1st and
                2nd prize funds will be combined and divided equally between
                the joint winners.
              </p>

              <p>
                If there is one outright winner and two or more entrants are
                tied for 2nd place, the 2nd prize will be divided equally
                between those entrants.
              </p>
            </>
          )}
        </RuleCard>

        {/* =====================================================
            HOW TO PLAY
        ===================================================== */}

        <RuleCard
          eyebrow="THE BASICS"
          title="How To Play"
          icon="✓"
        >
          <p>
            Each Match Week you predict the result of the listed Telford &
            Wrekin Hockey Club fixtures.
          </p>

          <p>
            For every fixture, choose one of:
          </p>

          <div className="predictionOptions">
            <PredictionOption letter="H" text="Home Win" />
            <PredictionOption letter="D" text="Draw" />
            <PredictionOption letter="A" text="Away Win" />
          </div>
        </RuleCard>

        {/* =====================================================
            SCORING
        ===================================================== */}

        <RuleCard
          eyebrow="POINTS"
          title="Scoring"
          icon="🎯"
        >
          <div className="scoreGrid">
            <div className="scoreBox correct">
              <div className="scoreIcon">✓</div>

              <div>
                <strong>Correct Prediction</strong>
                <span>1 POINT</span>
              </div>
            </div>

            <div className="scoreBox incorrect">
              <div className="scoreIcon">✕</div>

              <div>
                <strong>Incorrect Prediction</strong>
                <span>0 POINTS</span>
              </div>
            </div>
          </div>

          <p>
            Points are calculated automatically once the actual fixture
            results have been entered.
          </p>

          <p>
            Cancelled fixtures do not count and no points can be won or lost
            on them.
          </p>
        </RuleCard>

        {/* =====================================================
            PREDICTION WINDOWS
        ===================================================== */}

        <RuleCard
          eyebrow="DEADLINES"
          title="Prediction Windows"
          icon="⏱"
        >
          <p>
            Each Match Week has its own opening time and prediction deadline.
          </p>

          <p>
            You can make or change your selections at any time while that
            Match Week is open.
          </p>

          <Highlight
            type="blue"
            icon="🔒"
            title="Once the deadline passes"
          >
            All predictions are locked and can no longer be changed.
          </Highlight>

          <p>
            Locked predictions remain available to view afterwards, so you
            can check what you selected.
          </p>
        </RuleCard>

        {/* =====================================================
            MISSED PREDICTIONS
        ===================================================== */}

        <RuleCard
          eyebrow="DON'T MISS OUT"
          title="Missed Predictions"
          icon="!"
        >
          <p>
            You do not have to predict every fixture.
          </p>

          <Highlight
            type="amber"
            icon="!"
            title="No prediction = 0 points"
          >
            If you do not submit a prediction before the deadline, that
            fixture scores 0 points.
          </Highlight>

          <p>
            No prediction will be entered automatically and missing
            predictions cannot be added after the deadline.
          </p>
        </RuleCard>

        {/* =====================================================
            POSTPONED
        ===================================================== */}

        <RuleCard
          eyebrow="FIXTURE CHANGES"
          title="Postponed Fixtures"
          icon="↻"
        >
          <p>
            If a fixture is postponed, your original prediction will remain
            valid.
          </p>

          <Highlight
            type="blue"
            icon="↻"
            title="Your prediction carries forward"
          >
            It remains attached to the fixture until the rearranged match is
            played.
          </Highlight>

          <p>
            You will not be able to change your original prediction because
            of the postponement.
          </p>

          <p>
            Points will be awarded once the rearranged fixture has been
            completed and the result has been entered.
          </p>
        </RuleCard>

        {/* =====================================================
            CANCELLED
        ===================================================== */}

        <RuleCard
          eyebrow="FIXTURE CHANGES"
          title="Cancelled Fixtures"
          icon="✕"
        >
          <p>
            If a fixture is cancelled and will not be played, it will be
            removed from the active prediction list.
          </p>

          <Highlight
            type="red"
            icon="✕"
            title="No points awarded"
          >
            Any prediction already made for the cancelled fixture will not
            count.
          </Highlight>

          <p>
            No points will be awarded and the fixture will be excluded from
            the total number of available points for that Match Week.
          </p>

          <p>
            Cancelled fixtures will still be visible in the historical Match
            Week record for reference.
          </p>
        </RuleCard>

        {/* =====================================================
            LEADERBOARDS
        ===================================================== */}

        <RuleCard
          eyebrow="STANDINGS"
          title="Leaderboards"
          icon="🏆"
        >
          <div className="leaderboardInfoGrid">
            <div className="leaderboardInfo">
              <div className="lbIcon">🏆</div>

              <strong>Overall Leaderboard</strong>

              <span>
                Shows each entrant&apos;s total points across the competition.
              </span>
            </div>

            <div className="leaderboardInfo">
              <div className="lbIcon">📊</div>

              <strong>Weekly Leaderboards</strong>

              <span>
                Shows the points scored in each completed Match Week.
              </span>
            </div>
          </div>

          <p>
            Previous Weekly Leaderboards remain available, so you can look
            back at any completed Match Week.
          </p>

          <p>
            Once a Match Week has closed, entrants can view other
            players&apos; predictions, actual results and which selections
            were correct or incorrect.
          </p>

          <p>
            Players only appear on a leaderboard once they have made at least
            one relevant prediction.
          </p>
        </RuleCard>

        {/* =====================================================
            TIES
        ===================================================== */}

        <RuleCard
          eyebrow="RANKINGS"
          title="Tied Positions"
          icon="="
        >
          <p>
            Entrants with the same number of points share the same leaderboard
            position.
          </p>

          <p>
            Standard competition ranking is used.
          </p>

          <div className="rankingExample">
            <RankBubble number="1" label="1ST" gold />
            <RankBubble number="1" label="1ST" gold />
            <RankBubble number="3" label="3RD" />
          </div>
        </RuleCard>

        {/* =====================================================
            PROVISIONAL
        ===================================================== */}

        <RuleCard
          eyebrow="LIVE SCORING"
          title="Provisional Standings"
          icon="📊"
        >
          <p>
            Weekly standings may be shown as provisional while some fixture
            results are still outstanding.
          </p>

          <Highlight
            type="blue"
            icon="●"
            title="Standings update as results arrive"
          >
            Only fixtures with confirmed results contribute to the points
            total at that time.
          </Highlight>

          <p>
            Outstanding postponed fixtures will remain pending until the
            result is eventually entered.
          </p>
        </RuleCard>

        {/* =====================================================
            ACCOUNTS
        ===================================================== */}

        <RuleCard
          eyebrow="YOUR ENTRY"
          title="Accounts & Team Names"
          icon="👤"
        >
          <p>
            Predictions are linked to your individual Predictor account.
          </p>

          <p>
            Predictor team-name changes are controlled by the Administrator.
          </p>

          <Highlight
            type="blue"
            icon="✓"
            title="Make sure it saves"
          >
            Only predictions successfully saved before the relevant deadline
            will count.
          </Highlight>
        </RuleCard>

        {/* =====================================================
            FAIR PLAY
        ===================================================== */}

        <RuleCard
          eyebrow="THE PREDICTOR"
          title="Fair Play"
          icon="🤝"
        >
          <p>
            The Predictor is intended as a fun club competition.
          </p>

          <div className="fairPlayPanel">
            <div className="fairIcon">⚖</div>

            <p>
              The Administrator&apos;s decision will be final in the event of
              any unusual fixture, scoring or account issue not specifically
              covered above.
            </p>
          </div>
        </RuleCard>

        <a
          href="/predictor"
          className="backButton"
        >
          ← BACK TO THE PREDICTOR
        </a>

        <div className="footer">
          Telford & Wrekin Hockey Club
        </div>
      </div>

      <Styles />
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function BrandHeader() {
  return (
    <header className="brandHeader">
      <img
        src="/TWHC-badge-white.png"
        alt="Telford & Wrekin Hockey Club"
        className="brandBadge"
      />

      <div className="brandText">
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

        <div className="pageTag">
          COMPETITION RULES
        </div>
      </div>
    </header>
  );
}

function RuleCard({
  eyebrow,
  title,
  icon,
  children,
  featured = false,
}) {
  return (
    <section
      className={`ruleCard ${featured ? "featuredCard" : ""}`}
    >
      <div className="dualTop" />

      <div className="ruleHeader">
        <div>
          <div className="eyebrow">
            {eyebrow}
          </div>

          <h2>
            {title}
          </h2>
        </div>

        {icon && (
          <div className="ruleIcon">
            {icon}
          </div>
        )}
      </div>

      <div className="ruleBody">
        {children}
      </div>
    </section>
  );
}

function PredictionOption({
  letter,
  text,
}) {
  return (
    <div className="predictionOption">
      <div className="predictionLetter">
        {letter}
      </div>

      <strong>
        {text}
      </strong>
    </div>
  );
}

function Highlight({
  type,
  icon,
  title,
  children,
}) {
  return (
    <div
      className={`highlight ${type}Highlight`}
    >
      <span className="highlightIcon">
        {icon}
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <span className="highlightText">
          {children}
        </span>
      </div>
    </div>
  );
}

function RankBubble({
  number,
  label,
  gold = false,
}) {
  return (
    <div
      className={`rankBubble ${gold ? "goldRank" : ""}`}
    >
      <span>
        {number}
      </span>

      <small>
        {label}
      </small>
    </div>
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

/* =========================================================
   STYLES
========================================================= */

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

      a {
        text-decoration: none;
        -webkit-tap-highlight-color: transparent;
      }

      /* PAGE */

      .wowPage {
        position: relative;
        min-height: 100vh;
        overflow: hidden;

        color: #ffffff;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

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

        width:
          min(
            900px,
            calc(100% - 30px)
          );

        margin: 0 auto;

        padding:
          28px 0 34px;
      }

      /* BACKGROUND FX */

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

        transform:
          skewX(-35deg);

        pointer-events: none;

        opacity: 0.11;
      }

      .blueSlash {
        left: -125px;

        background:
          linear-gradient(
            90deg,
            transparent,
            #087eff
          );
      }

      .redSlash {
        right: -125px;

        background:
          linear-gradient(
            90deg,
            #ed1c24,
            transparent
          );
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

      /* HEADER */

      .brandHeader {
        display: flex;

        align-items: center;
        justify-content: center;

        gap: 14px;

        margin-bottom: 16px;
      }

      .brandBadge {
        display: block;

        width: 68px;

        height: auto;

        filter:
          drop-shadow(
            0 5px 12px
            rgba(0,0,0,0.42)
          );
      }

      .brandText {
        text-align: left;
      }

      .brandTitle {
        color: #ffffff;

        font-size: 34px;

        line-height: 0.95;

        font-weight: 950;

        letter-spacing: -1.7px;

        white-space: nowrap;

        text-shadow:
          0 3px 10px
          rgba(0,0,0,0.45);
      }

      .brandTitle span {
        color: #ed1c24;

        text-shadow:
          0 0 15px
          rgba(237,28,36,0.42);
      }

      .brandLine {
        height: 2px;

        margin-top: 8px;

        background:
          linear-gradient(
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
        margin-top: 6px;

        color: #9eb3c8;

        font-size: 10px;

        font-weight: 950;

        letter-spacing: 1.4px;
      }

      .intro {
        margin:
          0 auto 22px;

        color: #a8bdd1;

        text-align: center;

        font-size: 14px;

        font-weight: 750;
      }

      /* RULE CARDS */

      .ruleCard {
        position: relative;

        overflow: hidden;

        margin-bottom: 17px;

        padding:
          24px 24px 22px;

        border:
          1px solid
          rgba(104,150,196,0.38);

        border-radius: 15px;

        background:
          linear-gradient(
            155deg,
            rgba(12,35,64,0.97),
            rgba(4,17,33,0.97)
          );

        box-shadow:
          0 17px 42px
          rgba(0,0,0,0.30),
          inset 0 1px 0
          rgba(255,255,255,0.035);

        backdrop-filter:
          blur(15px);
      }

      .dualTop {
        position: absolute;

        top: 0;
        right: 0;
        left: 0;

        height: 3px;

        background:
          linear-gradient(
            90deg,
            #087eff 0%,
            #087eff 40%,
            #ed1c24 68%,
            #ed1c24 100%
          );
      }

      .featuredCard {
        border-color:
          rgba(230,163,25,0.38);
      }

      .featuredCard .dualTop {
        background:
          linear-gradient(
            90deg,
            #d98c00,
            #ffb51c 35%,
            #ed1c24 100%
          );
      }

      /* RULE HEADERS */

      .ruleHeader {
        display: flex;

        align-items: flex-start;
        justify-content: space-between;

        gap: 18px;

        margin-bottom: 17px;
      }

      .eyebrow {
        margin-bottom: 5px;

        color: #2b9cff;

        font-size: 10px;

        font-weight: 950;

        letter-spacing: 1.35px;
      }

      .featuredCard .eyebrow {
        color: #ffb51c;
      }

      .ruleHeader h2 {
        margin: 0;

        color: #ffffff;

        font-size: 25px;

        line-height: 1.05;

        font-weight: 950;

        letter-spacing: -0.5px;
      }

      .ruleIcon {
        display: grid;

        place-items: center;

        flex-shrink: 0;

        width: 54px;
        height: 54px;

        border:
          1px solid
          rgba(41,144,237,0.48);

        border-radius: 14px;

        background:
          linear-gradient(
            145deg,
            rgba(9,52,91,0.95),
            rgba(3,24,45,0.95)
          );

        color: #ffffff;

        font-size: 27px;

        font-weight: 950;
      }

      /* BODY */

      .ruleBody {
        color: #c2d0dd;

        font-size: 15px;

        line-height: 1.65;

        font-weight: 650;
      }

      .ruleBody p {
        margin:
          0 0 14px;
      }

      .ruleBody p:last-child {
        margin-bottom: 0;
      }

      .ruleBody strong,
      .ruleBody b {
        color: #ffffff;

        font-weight: 900;
      }

      /* ENTRY FEE */

      .entryFeeHero {
        display: flex;

        align-items: center;
        justify-content: space-between;

        gap: 20px;

        margin-bottom: 16px;

        padding:
          18px 20px;

        border:
          1px solid
          rgba(255,181,28,0.42);

        border-radius: 12px;

        background:
          linear-gradient(
            120deg,
            rgba(100,62,0,0.35),
            rgba(14,32,51,0.78)
          );
      }

      .miniLabel {
        color: #ffbd3d;

        font-size: 10px;

        font-weight: 950;

        letter-spacing: 1.2px;
      }

      .entryAmount {
        margin-top: 3px;

        color: #ffffff;

        font-size: 37px;

        line-height: 1;

        font-weight: 950;
      }

      .entrySub {
        margin-top: 7px;

        color: #c3ad7b;

        font-size: 11px;

        font-weight: 750;
      }

      .entryIcon {
        display: grid;

        place-items: center;

        width: 64px;
        height: 64px;

        flex-shrink: 0;

        border-radius: 15px;

        background:
          linear-gradient(
            145deg,
            #c37a00,
            #f1a000
          );

        color: #ffffff;

        font-size: 30px;

        font-weight: 950;
      }

      /* PAYMENT */

      .paymentGrid {
        display: grid;

        grid-template-columns:
          repeat(2,1fr);

        gap: 11px;

        margin-bottom: 16px;
      }

      .infoPanel {
        display: flex;

        align-items: flex-start;

        gap: 11px;

        padding: 14px;

        border-radius: 11px;
      }

      .infoPanel strong {
        display: block;

        margin-bottom: 4px;

        font-size: 14px;
      }

      .infoPanel p {
        margin: 0;

        font-size: 12px;

        line-height: 1.5;
      }

      .bluePanel {
        border:
          1px solid
          rgba(38,149,248,0.37);

        background:
          rgba(0,96,183,0.15);
      }

      .redPanel {
        border:
          1px solid
          rgba(237,28,36,0.33);

        background:
          rgba(142,19,27,0.14);
      }

      .infoIcon {
        font-size: 22px;
      }

      /* PRIZES */

      .prizeGrid {
        display: grid;

        grid-template-columns:
          repeat(2,1fr);

        gap: 11px;

        margin-bottom: 17px;
      }

      .prizeCard {
        display: flex;

        align-items: center;

        gap: 13px;

        padding: 15px;

        border-radius: 11px;
      }

      .prizeCard.gold {
        border:
          1px solid
          rgba(239,178,23,0.43);

        background:
          rgba(112,75,0,0.26);
      }

      .prizeCard.silver {
        border:
          1px solid
          rgba(176,195,214,0.34);

        background:
          rgba(108,127,146,0.15);
      }

      .medal {
        font-size: 29px;
      }

      .prizeLabel {
        color: #9eb3c8;

        font-size: 9px;

        font-weight: 950;

        letter-spacing: 1px;
      }

      .gold .prizeLabel {
        color: #e9bb45;
      }

      .prizeAmount {
        margin-top: 3px;

        color: #ffffff;

        font-size: 25px;

        line-height: 1;

        font-weight: 950;
      }

      /* H D A */

      .predictionOptions {
        display: grid;

        grid-template-columns:
          repeat(3,1fr);

        gap: 11px;

        margin-top: 13px;
      }

      .predictionOption {
        padding:
          15px 10px;

        border:
          1px solid
          rgba(41,144,237,0.38);

        border-radius: 11px;

        background:
          rgba(5,39,70,0.65);

        text-align: center;
      }

      .predictionLetter {
        display: grid;

        place-items: center;

        width: 47px;
        height: 47px;

        margin:
          0 auto 9px;

        border:
          1px solid
          rgba(255,255,255,0.78);

        border-radius: 10px;

        background:
          linear-gradient(
            120deg,
            #087eff,
            #405eea 40%,
            #bd286b 70%,
            #ed1c24
          );

        color: #ffffff;

        font-size: 17px;

        font-weight: 950;
      }

      .predictionOption strong {
        font-size: 13px;
      }

      /* SCORING */

      .scoreGrid {
        display: grid;

        grid-template-columns:
          repeat(2,1fr);

        gap: 11px;

        margin-bottom: 16px;
      }

      .scoreBox {
        display: flex;

        align-items: center;

        gap: 12px;

        padding: 15px;

        border-radius: 11px;
      }

      .scoreBox.correct {
        border:
          1px solid
          rgba(42,205,116,0.40);

        background:
          rgba(12,104,56,0.20);
      }

      .scoreBox.incorrect {
        border:
          1px solid
          rgba(237,67,75,0.36);

        background:
          rgba(135,21,28,0.18);
      }

      .scoreIcon {
        display: grid;

        place-items: center;

        width: 42px;
        height: 42px;

        flex-shrink: 0;

        border-radius: 50%;

        color: #ffffff;

        font-size: 20px;

        font-weight: 950;
      }

      .correct .scoreIcon {
        background: #1bb564;
      }

      .incorrect .scoreIcon {
        background: #bc2730;
      }

      .scoreBox strong {
        display: block;

        font-size: 13px;
      }

      .scoreBox span {
        display: block;

        margin-top: 3px;

        font-size: 10px;

        font-weight: 950;
      }

      /* HIGHLIGHTS */

      .highlight {
        display: flex;

        align-items: center;

        gap: 13px;

        margin:
          15px 0;

        padding:
          14px 15px;

        border-radius: 11px;
      }

      .highlightIcon {
        display: grid;

        place-items: center;

        width: 38px;
        height: 38px;

        flex-shrink: 0;

        border-radius: 50%;

        color: #ffffff;

        font-size: 16px;

        font-weight: 950;
      }

      .highlight strong {
        display: block;

        margin-bottom: 3px;

        font-size: 13px;
      }

      .highlightText {
        display: block;

        font-size: 12px;

        line-height: 1.5;
      }

      .blueHighlight {
        border:
          1px solid
          rgba(39,146,242,0.36);

        background:
          rgba(0,91,174,0.15);
      }

      .blueHighlight .highlightIcon {
        background: #087bdc;
      }

      .amberHighlight {
        border:
          1px solid
          rgba(242,170,44,0.40);

        background:
          rgba(119,72,0,0.20);
      }

      .amberHighlight .highlightIcon {
        background: #c98300;
      }

      .redHighlight {
        border:
          1px solid
          rgba(237,54,63,0.36);

        background:
          rgba(132,18,25,0.18);
      }

      .redHighlight .highlightIcon {
        background: #c4242d;
      }

      /* LEADERBOARDS */

      .leaderboardInfoGrid {
        display: grid;

        grid-template-columns:
          repeat(2,1fr);

        gap: 11px;

        margin-bottom: 16px;
      }

      .leaderboardInfo {
        padding: 16px;

        border:
          1px solid
          rgba(43,144,235,0.35);

        border-radius: 11px;

        background:
          rgba(5,39,70,0.55);

        text-align: center;
      }

      .lbIcon {
        margin-bottom: 7px;

        font-size: 27px;
      }

      .leaderboardInfo strong {
        display: block;

        font-size: 14px;
      }

      .leaderboardInfo span {
        display: block;

        margin-top: 5px;

        color: #9eb3c8;

        font-size: 12px;

        line-height: 1.45;
      }

      /* RANKING */

      .rankingExample {
        display: flex;

        justify-content: center;

        gap: 14px;

        margin-top: 14px;

        padding: 16px;

        border:
          1px solid
          rgba(62,139,213,0.30);

        border-radius: 11px;

        background:
          rgba(3,24,45,0.62);
      }

      .rankBubble {
        display: flex;

        flex-direction: column;

        align-items: center;
        justify-content: center;

        width: 59px;
        height: 59px;

        border:
          1px solid
          rgba(40,145,239,0.42);

        border-radius: 50%;

        background:
          linear-gradient(
            145deg,
            #0b365f,
            #061e38
          );
      }

      .goldRank {
        border-color:
          rgba(255,201,54,0.58);

        background:
          linear-gradient(
            145deg,
            #926100,
            #3a2a06
          );
      }

      .rankBubble span {
        color: #ffffff;

        font-size: 19px;

        line-height: 1;

        font-weight: 950;
      }

      .rankBubble small {
        margin-top: 4px;

        color: #6ebaff;

        font-size: 8px;

        font-weight: 950;
      }

      .goldRank small {
        color: #ffc942;
      }

      /* FAIR PLAY */

      .fairPlayPanel {
        display: flex;

        align-items: center;

        gap: 15px;

        padding: 16px;

        border:
          1px solid
          rgba(98,148,197,0.34);

        border-radius: 11px;

        background:
          rgba(5,31,56,0.56);
      }

      .fairPlayPanel p {
        margin: 0;
      }

      .fairIcon {
        display: grid;

        place-items: center;

        width: 50px;
        height: 50px;

        flex-shrink: 0;

        border-radius: 50%;

        background:
          linear-gradient(
            120deg,
            #087eff,
            #405eea 40%,
            #bd286b 70%,
            #ed1c24
          );

        color: #ffffff;

        font-size: 23px;

        font-weight: 950;
      }

      /* BACK */

      .backButton {
        display: flex;

        align-items: center;
        justify-content: center;

        width: 100%;

        min-height: 52px;

        margin-top: 4px;

        border-radius: 10px;

        background:
          linear-gradient(
            105deg,
            #087eff 0%,
            #405eea 40%,
            #bd286b 70%,
            #ed1c24 100%
          );

        color: #ffffff;

        font-size: 13px;

        font-weight: 950;

        letter-spacing: 0.35px;
      }

      .footer {
        margin-top: 24px;

        color: #647b91;

        text-align: center;

        font-size: 10px;
      }

      /* =====================================================
         MOBILE
         THIS IS THE IMPORTANT SIZE FIX
      ===================================================== */

      @media (max-width: 620px) {

        .pageShell {
          width:
            calc(100% - 16px);

          padding-top: 17px;
        }

        .brandHeader {
          gap: 10px;

          margin-bottom: 13px;
        }

        .brandBadge {
          width: 52px;
        }

        .brandTitle {
          font-size: 25px;

          letter-spacing: -1.25px;
        }

        .brandTag {
          gap: 6px;

          font-size: 7px;

          letter-spacing: 1.15px;
        }

        .pageTag {
          font-size: 8px;
        }

        .intro {
          margin-bottom: 17px;

          font-size: 13px;
        }

        .ruleCard {
          margin-bottom: 12px;

          padding:
            19px 15px 17px;

          border-radius: 13px;
        }

        .ruleHeader {
          margin-bottom: 14px;
        }

        .ruleHeader h2 {
          font-size: 23px;
        }

        .eyebrow {
          font-size: 8px;
        }

        .ruleIcon {
          width: 46px;
          height: 46px;

          border-radius: 11px;

          font-size: 22px;
        }

        /* KEY FIX:
           NORMAL, READABLE MOBILE BODY COPY */

        .ruleBody {
          font-size: 15px;

          line-height: 1.6;

          font-weight: 650;
        }

        .ruleBody p {
          margin-bottom: 13px;
        }

        .entryFeeHero {
          padding:
            15px 14px;
        }

        .entryAmount {
          font-size: 32px;
        }

        .entryIcon {
          width: 54px;
          height: 54px;

          font-size: 25px;
        }

        .entrySub {
          font-size: 11px;
        }

        .paymentGrid,
        .prizeGrid,
        .scoreGrid,
        .leaderboardInfoGrid {
          grid-template-columns: 1fr;
        }

        .infoPanel strong {
          font-size: 14px;
        }

        .infoPanel p {
          font-size: 12px;

          line-height: 1.5;
        }

        .predictionOptions {
          gap: 7px;
        }

        .predictionOption {
          padding:
            13px 5px;
        }

        .predictionLetter {
          width: 42px;
          height: 42px;

          font-size: 15px;
        }

        .predictionOption strong {
          font-size: 11px;
        }

        .highlight {
          padding:
            12px 11px;

          gap: 10px;
        }

        .highlightIcon {
          width: 34px;
          height: 34px;

          font-size: 14px;
        }

        .highlight strong {
          font-size: 13px;
        }

        .highlightText {
          font-size: 12px;

          line-height: 1.5;
        }

        .leaderboardInfo strong {
          font-size: 14px;
        }

        .leaderboardInfo span {
          font-size: 12px;
        }

        .rankingExample {
          gap: 10px;
        }

        .rankBubble {
          width: 54px;
          height: 54px;
        }

        .fairPlayPanel {
          align-items: flex-start;

          padding: 13px;
        }

        .fairIcon {
          width: 42px;
          height: 42px;

          font-size: 19px;
        }

        .backButton {
          min-height: 48px;

          font-size: 11px;
        }
      }

      @media (max-width: 390px) {

        .brandBadge {
          width: 47px;
        }

        .brandTitle {
          font-size: 22px;
        }

        .ruleHeader h2 {
          font-size: 21px;
        }

        .ruleBody {
          font-size: 14.5px;

          line-height: 1.6;
        }

        .predictionOption strong {
          font-size: 10px;
        }
      }

    `}</style>
  );
}
