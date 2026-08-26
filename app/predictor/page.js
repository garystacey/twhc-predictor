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

  /* =====================================================
     LOAD DATA
     ===================================================== */

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      /* PROFILE */

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

      /* COMPETITION SETTINGS */

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

      /* CURRENT MATCH WEEK */

      const now =
        new Date().toISOString();

      const {
        data: weekData,
      } = await supabase
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

        const {
          data: fixtureData,
        } = await supabase
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
     MONEY
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

    return `£${amount.toFixed(2)}`;
  }

  /* =====================================================
     DATE
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
     PAYMENT STATUS
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
      <main className="wowPage">
        <BackgroundGlow />

        <div className="wowShell">
          <BrandHeader />

          <div className="loadingBox">
            <div className="loadingPulse" />
            <div>
              Loading The Predictor...
            </div>
          </div>
        </div>

        <Styles />
      </main>
    );
  }

  /* =====================================================
     STATUS VALUES
     ===================================================== */

  const allComplete =
    predictionStatus &&
    predictionStatus.total > 0 &&
    predictionStatus.completed ===
      predictionStatus.total;

  const remaining =
    predictionStatus
      ? predictionStatus.total -
        predictionStatus.completed
      : 0;

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

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <main className="wowPage">
      <BackgroundGlow />

      <div className="wowShell">

        {/* HEADER */}

        <div className="topBar">
          <BrandHeader />

          <div className="userBlock">
            <div className="welcomeText">
              Welcome,{" "}
              <strong>
                {profile?.first_name}{" "}
                {profile?.surname}
              </strong>
            </div>

            {profile?.team_name && (
              <div className="teamBadge">
                {profile.team_name}
              </div>
            )}
          </div>

          <button
            className="signOutMini"
            onClick={
              handleSignOut
            }
            disabled={
              signingOut
            }
          >
            {signingOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>

        {/* MAIN DESKTOP GRID */}

        <div className="dashboardGrid">

          {/* LEFT */}

          <section className="dashboardMain">

            {/* PAYMENT */}

            {showPaymentReminder && (
              <div
                className={`glassCard paymentCard ${paymentStatus}`}
              >
                <div className="cardAccent amberAccent" />

                <div className="paymentTop">
                  <div>
                    <div className="eyebrow amber">
                      {paymentStatus ===
                      "overdue"
                        ? "PAYMENT OVERDUE"
                        : paymentStatus ===
                          "today"
                        ? "PAYMENT DUE TODAY"
                        : "ENTRY FEE OUTSTANDING"}
                    </div>

                    <h2>
                      Predictor Entry Fee
                    </h2>
                  </div>

                  <div className="feePill">
                    <span>
                      TO PAY
                    </span>

                    <strong>
                      {
                        formattedEntryFee
                      }
                    </strong>
                  </div>
                </div>

                <div className="paymentMessage">
                  Your{" "}
                  <strong>
                    {
                      formattedEntryFee
                    }{" "}
                    Predictor entry fee
                  </strong>{" "}
                  has not yet been marked
                  as paid.

                  {formattedPaymentDeadline && (
                    <>
                      {" "}
                      Please make payment
                      by{" "}
                      <strong>
                        {
                          formattedPaymentDeadline
                        }
                      </strong>{" "}
                      to complete your
                      competition entry.
                    </>
                  )}
                </div>

                <div className="smallNote">
                  This reminder will
                  disappear automatically
                  once your entry has been
                  marked as paid.
                </div>
              </div>
            )}

            {/* CURRENT WEEK */}

            {currentWeek &&
              predictionStatus && (
                <div className="glassCard weekCard">
                  <div className="cardAccent dualAccent" />

                  <div className="weekHeader">
                    <div>
                      <div className="eyebrow blue">
                        CURRENT
                      </div>

                      <h1>
                        Match Week{" "}
                        {
                          currentWeek.week_no
                        }
                      </h1>
                    </div>

                    <div
                      className={`scorePill ${
                        allComplete
                          ? "complete"
                          : ""
                      }`}
                    >
                      <strong>
                        {
                          predictionStatus.completed
                        }
                        /
                        {
                          predictionStatus.total
                        }
                      </strong>

                      <span>
                        SELECTED
                      </span>
                    </div>
                  </div>

                  {allComplete ? (
                    <div className="statusStrip completeStrip">
                      ✓ All predictions
                      completed
                    </div>
                  ) : (
                    <div className="statusStrip pendingStrip">
                      <strong>
                        {remaining}
                      </strong>{" "}
                      prediction
                      {remaining === 1
                        ? ""
                        : "s"}{" "}
                      still required
                    </div>
                  )}

                  <a
                    href="/predictions"
                    className="primaryCta"
                  >
                    {allComplete
                      ? "REVIEW PREDICTIONS"
                      : "COMPLETE PREDICTIONS"}
                    <span>→</span>
                  </a>
                </div>
              )}
          </section>

          {/* RIGHT MENU */}

          <section className="menuGrid">

            <WowTile
              icon="✓"
              title="Predictions"
              text="View the fixtures and make or review your selections."
              href="/predictions"
              button="Make Predictions"
            />

            <WowTile
              icon="🏆"
              title="Overall Leaderboard"
              text="See who's leading The Predictor across the season."
              href="/leaderboard"
              button="View Leaderboard"
            />

            <WowTile
              icon="📊"
              title="Weekly Leaderboards"
              text="View results and standings from completed Match Weeks."
              href="/last-week"
              button="Weekly Leaderboards"
            />

            <WowTile
              icon="📋"
              title="Competition Rules"
              text="Check scoring, deadlines, prizes and competition rules."
              href="/rules"
              button="View Rules"
            />

            {profile?.role ===
              "admin" && (
              <WowTile
                icon="⚙"
                title="Administrator"
                text="Manage members, fixtures, results and competition settings."
                href="/admin"
                button="Admin Area"
                admin
              />
            )}
          </section>
        </div>

        <div className="footer">
          Telford & Wrekin Hockey Club
        </div>
      </div>

      <Styles />
    </main>
  );
}

/* =====================================================
   BRAND HEADER
   ===================================================== */

function BrandHeader() {
  return (
    <div className="brandHeader">
      <img
        src="/TWHC-badge-white.png"
        alt="Telford & Wrekin Hockey Club"
        className="brandBadge"
      />

      <div>
        <div className="brandTitle">
          THE PREDICTO
          <span>R</span>
        </div>

        <div className="brandLine" />

        <div className="brandTag">
          <span className="blueText">
            PREDICT
          </span>
          <b>•</b>
          <span>
            COMPETE
          </span>
          <b>•</b>
          <span className="redText">
            WIN
          </span>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   MENU TILE
   ===================================================== */

function WowTile({
  icon,
  title,
  text,
  href,
  button,
  admin = false,
}) {
  return (
    <a
      href={href}
      className={`wowTile ${
        admin
          ? "adminTile"
          : ""
      }`}
    >
      <div className="tileGlow" />

      <div className="tileIcon">
        {icon}
      </div>

      <h2>
        {title}
      </h2>

      <p>
        {text}
      </p>

      <div
        className={`tileButton ${
          admin
            ? "adminButton"
            : ""
        }`}
      >
        {button}
      </div>
    </a>
  );
}

/* =====================================================
   BACKGROUND
   ===================================================== */

function BackgroundGlow() {
  return (
    <>
      <div className="bgBlueGlow" />
      <div className="bgRedGlow" />

      <div className="blueSlash one" />
      <div className="blueSlash two" />

      <div className="redSlash one" />
      <div className="redSlash two" />
    </>
  );
}

/* =====================================================
   STYLES
   ===================================================== */

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
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .wowPage {
        min-height: 100vh;
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(
            circle at 10% 18%,
            rgba(0, 112, 255, 0.16),
            transparent 32%
          ),
          radial-gradient(
            circle at 90% 42%,
            rgba(237, 28, 36, 0.12),
            transparent 35%
          ),
          linear-gradient(
            135deg,
            #061b35 0%,
            #031428 37%,
            #050e1c 66%,
            #160c18 100%
          );
        color: #ffffff;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
      }

      .wowShell {
        position: relative;
        z-index: 5;
        width: min(
          1180px,
          calc(100% - 34px)
        );
        margin: 0 auto;
        padding: 30px 0 26px;
      }

      /* =========================
         BACKGROUND FX
         ========================= */

      .bgBlueGlow,
      .bgRedGlow {
        position: fixed;
        width: 470px;
        height: 470px;
        border-radius: 50%;
        filter: blur(110px);
        pointer-events: none;
        opacity: 0.18;
      }

      .bgBlueGlow {
        left: -180px;
        top: 80px;
        background: #087eff;
      }

      .bgRedGlow {
        right: -190px;
        top: 150px;
        background: #ed1c24;
      }

      .blueSlash,
      .redSlash {
        position: fixed;
        width: 280px;
        height: 58px;
        transform: skewX(-35deg);
        opacity: 0.13;
        pointer-events: none;
      }

      .blueSlash {
        left: -120px;
        background:
          linear-gradient(
            90deg,
            transparent,
            #087eff
          );
      }

      .blueSlash.one {
        top: 18%;
      }

      .blueSlash.two {
        bottom: 12%;
      }

      .redSlash {
        right: -120px;
        background:
          linear-gradient(
            90deg,
            #ed1c24,
            transparent
          );
      }

      .redSlash.one {
        top: 28%;
      }

      .redSlash.two {
        bottom: 7%;
      }

      /* =========================
         TOP BAR
         ========================= */

      .topBar {
        display: grid;
        grid-template-columns:
          1fr auto 1fr;
        align-items: center;
        gap: 22px;
        margin-bottom: 28px;
      }

      .brandHeader {
        display: flex;
        align-items: center;
        gap: 13px;
      }

      .brandBadge {
        width: 61px;
        height: auto;
        display: block;
        filter:
          drop-shadow(
            0 5px 12px rgba(
              0,
              0,
              0,
              0.45
            )
          );
      }

      .brandTitle {
        font-size: 29px;
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -1.6px;
        white-space: nowrap;
        color: #ffffff;
        text-shadow:
          0 3px 10px rgba(
            0,
            0,
            0,
            0.5
          );
      }

      .brandTitle span {
        color: #ed1c24;
        text-shadow:
          0 0 16px rgba(
            237,
            28,
            36,
            0.45
          );
      }

      .brandLine {
        height: 2px;
        margin-top: 7px;
        background:
          linear-gradient(
            90deg,
            #087eff,
            transparent 50%,
            #ed1c24
          );
      }

      .brandTag {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 7px;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 1.8px;
        color: #e8eff7;
      }

      .brandTag b {
        color: #5f7690;
      }

      .blueText {
        color: #2d9cff;
      }

      .redText {
        color: #ff3040;
      }

      .userBlock {
        text-align: center;
      }

      .welcomeText {
        font-size: 13px;
        color: #c5d3e1;
      }

      .welcomeText strong {
        color: #ffffff;
      }

      .teamBadge {
        display: inline-block;
        margin-top: 5px;
        padding: 6px 12px;
        border-radius: 999px;
        border:
          1px solid rgba(
            0,
            135,
            255,
            0.5
          );
        background:
          rgba(
            0,
            92,
            178,
            0.18
          );
        color: #40a9ff;
        font-size: 11px;
        font-weight: 900;
        box-shadow:
          inset 0 0 16px rgba(
            0,
            128,
            255,
            0.08
          );
      }

      .signOutMini {
        justify-self: end;
        width: auto;
        min-width: 94px;
        margin: 0;
        padding: 11px 17px;
        border-radius: 8px;
        border:
          1px solid rgba(
            151,
            182,
            215,
            0.3
          );
        background:
          rgba(
            9,
            28,
            51,
            0.72
          );
        color: #dbe7f4;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.4px;
        cursor: pointer;
        box-shadow:
          inset 0 1px 0 rgba(
            255,
            255,
            255,
            0.04
          );
      }

      .signOutMini:hover {
        border-color:
          rgba(
            237,
            28,
            36,
            0.6
          );
        color: #ffffff;
      }

      /* =========================
         DASHBOARD
         ========================= */

      .dashboardGrid {
        display: grid;
        grid-template-columns:
          minmax(0, 1.08fr)
          minmax(430px, 0.92fr);
        gap: 22px;
        align-items: stretch;
      }

      .dashboardMain {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .glassCard,
      .wowTile {
        position: relative;
        overflow: hidden;
        background:
          linear-gradient(
            155deg,
            rgba(
              12,
              35,
              64,
              0.94
            ),
            rgba(
              4,
              17,
              33,
              0.94
            )
          );
        border:
          1px solid rgba(
            111,
            153,
            197,
            0.37
          );
        box-shadow:
          0 16px 40px rgba(
            0,
            0,
            0,
            0.28
          ),
          inset 0 1px 0 rgba(
            255,
            255,
            255,
            0.035
          );
        backdrop-filter:
          blur(15px);
      }

      .glassCard {
        border-radius: 14px;
        padding: 22px;
      }

      .cardAccent {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        height: 3px;
      }

      .dualAccent {
        background:
          linear-gradient(
            90deg,
            #087eff,
            #087eff 35%,
            #ed1c24 100%
          );
      }

      .amberAccent {
        background:
          linear-gradient(
            90deg,
            #ff9a00,
            #ffd05b 50%,
            #ed1c24
          );
      }

      /* =========================
         PAYMENT
         ========================= */

      .paymentCard {
        border-color:
          rgba(
            233,
            155,
            33,
            0.42
          );
      }

      .paymentTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .paymentTop h2,
      .weekHeader h1 {
        margin: 4px 0 0;
        color: #ffffff;
        font-size: 24px;
        line-height: 1.05;
        font-weight: 950;
        letter-spacing: -0.7px;
      }

      .eyebrow {
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 1.2px;
      }

      .eyebrow.amber {
        color: #ffaf28;
      }

      .eyebrow.blue {
        color: #239cff;
      }

      .feePill {
        min-width: 86px;
        padding: 11px 13px;
        text-align: center;
        border-radius: 12px;
        color: #ffffff;
        background:
          linear-gradient(
            145deg,
            #b76500,
            #e89900
          );
        border:
          1px solid rgba(
            255,
            190,
            72,
            0.6
          );
        box-shadow:
          0 8px 20px rgba(
            224,
            139,
            0,
            0.2
          );
      }

      .feePill span {
        display: block;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.8px;
        opacity: 0.8;
      }

      .feePill strong {
        display: block;
        margin-top: 2px;
        font-size: 23px;
        line-height: 1;
      }

      .paymentMessage {
        margin-top: 18px;
        padding: 14px 15px;
        border-radius: 9px;
        border:
          1px solid rgba(
            255,
            177,
            31,
            0.35
          );
        background:
          rgba(
            120,
            72,
            0,
            0.19
          );
        color: #f2d3a0;
        font-size: 13px;
        font-weight: 650;
        line-height: 1.55;
      }

      .smallNote {
        margin-top: 10px;
        color: #55a9f4;
        font-size: 10px;
        font-weight: 700;
      }

      /* =========================
         WEEK
         ========================= */

      .weekCard {
        flex: 1;
      }

      .weekHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .scorePill {
        min-width: 82px;
        padding: 10px;
        border-radius: 11px;
        text-align: center;
        border:
          1px solid rgba(
            68,
            138,
            209,
            0.38
          );
        background:
          rgba(
            4,
            18,
            35,
            0.9
          );
      }

      .scorePill strong {
        display: block;
        color: #ffffff;
        font-size: 20px;
        line-height: 1;
      }

      .scorePill span {
        display: block;
        margin-top: 4px;
        color: #adc6df;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.7px;
      }

      .scorePill.complete {
        border-color:
          rgba(
            43,
            196,
            113,
            0.45
          );
        background:
          rgba(
            18,
            108,
            60,
            0.3
          );
      }

      .statusStrip {
        margin-top: 19px;
        padding: 12px;
        border-radius: 9px;
        text-align: center;
        font-size: 13px;
        font-weight: 900;
      }

      .pendingStrip {
        border:
          1px solid rgba(
            255,
            171,
            26,
            0.38
          );
        background:
          rgba(
            103,
            60,
            0,
            0.24
          );
        color: #e9b04d;
      }

      .completeStrip {
        border:
          1px solid rgba(
            52,
            194,
            114,
            0.42
          );
        background:
          rgba(
            15,
            100,
            56,
            0.26
          );
        color: #65dc97;
      }

      .primaryCta,
      .tileButton {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 9px;
        color: #ffffff;
        font-weight: 900;
        text-align: center;
        background:
          linear-gradient(
            100deg,
            #087eff 0%,
            #405eea 40%,
            #c12665 72%,
            #ed1c24 100%
          );
        box-shadow:
          0 8px 18px rgba(
            0,
            76,
            190,
            0.22
          );
      }

      .primaryCta {
        margin-top: 15px;
        min-height: 48px;
        padding: 13px 18px;
        font-size: 13px;
        letter-spacing: 0.4px;
      }

      .primaryCta:hover,
      .tileButton:hover {
        filter: brightness(1.08);
      }

      /* =========================
         TILES
         ========================= */

      .menuGrid {
        display: grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );
        gap: 14px;
      }

      .wowTile {
        min-height: 246px;
        padding: 21px 17px 17px;
        border-radius: 13px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        color: #ffffff;
        transition:
          transform 0.2s ease,
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .wowTile:hover {
        transform:
          translateY(-3px);
        border-color:
          rgba(
            28,
            136,
            255,
            0.72
          );
        box-shadow:
          0 18px 42px rgba(
            0,
            0,
            0,
            0.38
          ),
          0 0 24px rgba(
            0,
            112,
            255,
            0.08
          );
      }

      .wowTile::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 52%;
        height: 2px;
        background:
          #087eff;
      }

      .wowTile::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 48%;
        height: 2px;
        background:
          #ed1c24;
      }

      .tileGlow {
        position: absolute;
        inset: auto -40px -60px auto;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background:
          rgba(
            237,
            28,
            36,
            0.07
          );
        filter: blur(32px);
      }

      .tileIcon {
        min-height: 44px;
        display: grid;
        place-items: center;
        margin-bottom: 10px;
        font-size: 34px;
        line-height: 1;
      }

      .wowTile h2 {
        margin: 0;
        color: #ffffff;
        font-size: 20px;
        line-height: 1.08;
        font-weight: 950;
        letter-spacing: -0.4px;
      }

      .wowTile p {
        margin: 12px 0 17px;
        color: #aebed0;
        font-size: 12px;
        line-height: 1.5;
      }

      .tileButton {
        width: 100%;
        margin-top: auto;
        min-height: 43px;
        padding: 11px 12px;
        font-size: 11px;
      }

      .adminTile {
        border-color:
          rgba(
            237,
            28,
            36,
            0.42
          );
      }

      .adminButton {
        background:
          linear-gradient(
            100deg,
            #8e1117,
            #ed1c24
          );
      }

      /* =========================
         FOOTER
         ========================= */

      .footer {
        margin-top: 24px;
        text-align: center;
        color: #71869a;
        font-size: 10px;
      }

      /* =========================
         LOADING
         ========================= */

      .loadingBox {
        width: min(
          460px,
          100%
        );
        margin: 70px auto;
        padding: 30px;
        border-radius: 14px;
        text-align: center;
        color: #b7c9dc;
        background:
          rgba(
            7,
            26,
            49,
            0.82
          );
        border:
          1px solid rgba(
            95,
            145,
            194,
            0.35
          );
      }

      .loadingPulse {
        width: 12px;
        height: 12px;
        margin: 0 auto 13px;
        border-radius: 50%;
        background: #168eff;
        box-shadow:
          0 0 20px
          #168eff;
        animation:
          pulse 1.1s
          infinite ease-in-out;
      }

      @keyframes pulse {
        50% {
          opacity: 0.35;
          transform:
            scale(0.75);
        }
      }

      /* =========================
         TABLET
         ========================= */

      @media (
        max-width: 980px
      ) {
        .topBar {
          grid-template-columns:
            1fr auto;
        }

        .userBlock {
          grid-column:
            1 / -1;
          grid-row: 2;
        }

        .dashboardGrid {
          grid-template-columns:
            1fr;
        }

        .menuGrid {
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
        }
      }

      /* =========================
         MOBILE
         ========================= */

      @media (
        max-width: 620px
      ) {
        .wowShell {
          width:
            min(
              100% - 20px,
              1180px
            );
          padding-top: 18px;
        }

        .topBar {
          display: flex;
          flex-direction: column;
          gap: 13px;
          margin-bottom: 18px;
        }

        .brandHeader {
          justify-content:
            center;
        }

        .brandBadge {
          width: 52px;
        }

        .brandTitle {
          font-size: 25px;
        }

        .brandTag {
          font-size: 8px;
          letter-spacing:
            1.3px;
        }

        .signOutMini {
          display: none;
        }

        .dashboardGrid {
          gap: 13px;
        }

        .glassCard {
          padding: 17px 14px;
        }

        .paymentTop h2,
        .weekHeader h1 {
          font-size: 21px;
        }

        .feePill {
          min-width: 74px;
        }

        .menuGrid {
          grid-template-columns:
            1fr;
        }

        .wowTile {
          min-height: auto;
          padding:
            17px 15px;
        }

        .wowTile p {
          margin:
            8px 0 13px;
        }

        .tileIcon {
          font-size: 28px;
          min-height: 35px;
        }

        .wowTile h2 {
          font-size: 19px;
        }

        .paymentMessage {
          font-size: 12px;
        }

        .primaryCta {
          font-size: 12px;
        }
      }
    `}</style>
  );
}
