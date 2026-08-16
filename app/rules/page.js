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
    <main>
      <div className="container">
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">Competition Rules</p>

        <div className="card">
          <h2>Entry Fee & Prize Money</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
            {loadingSettings ? (
              <p>Loading competition details...</p>
            ) : (
              <>
                <p>
                  <strong>
                    Entry Fee: {formatMoney(settings.entry_fee)}
                  </strong>
                </p>

                <p>
                  The entry fee is to be paid via the
                  <strong> Telford & Wrekin HC Teamo app</strong>.
                </p>

                <p>
                  <strong>
                    1st Prize: {formatMoney(settings.first_prize)}
                  </strong>
                  <br />
                  <strong>
                    2nd Prize: {formatMoney(settings.second_prize)}
                  </strong>
                </p>

                <p>
                  Prize amounts will be confirmed once the prize fund
                  has been finalised.
                </p>

                <p>
                  If two or more entrants are tied for 1st place, the
                  1st and 2nd prize funds will be combined and divided
                  equally between the joint winners.
                </p>

                <p>
                  If there is one outright winner and two or more
                  entrants are tied for 2nd place, the 2nd prize will be
                  divided equally between those entrants.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h2>How To Play</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
            <p>
              Each Match Week you predict the result of the listed
              Telford & Wrekin Hockey Club fixtures.
            </p>

            <p>For every fixture, choose one of:</p>

            <p>
              <strong>H</strong> — Home Win
              <br />
              <strong>D</strong> — Draw
              <br />
              <strong>A</strong> — Away Win
            </p>
          </div>
        </div>

        <div className="card">
          <h2>Scoring</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
            <p>
              <strong>Correct prediction: 1 point</strong>
            </p>

            <p>
              <strong>Incorrect prediction: 0 points</strong>
            </p>

            <p>
              Points are calculated automatically once the actual
              fixture results have been entered.
            </p>

            <p>
              Cancelled fixtures do not count and no points can be won
              or lost on them.
            </p>
          </div>
        </div>

        <div className="card">
          <h2>Prediction Windows</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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

        <div className="card">
          <h2>Missed Predictions</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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

        <div className="card">
          <h2>Postponed Fixtures</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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

        <div className="card">
          <h2>Cancelled Fixtures</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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

        <div className="card">
          <h2>Leaderboards</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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

        <div className="card">
          <h2>Tied Positions</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
            <p>
              Entrants with the same number of points share the same
              leaderboard position.
            </p>

            <p>Standard competition ranking is used.</p>

            <p>
              For example:
              <br />
              <strong>1st, 1st, 3rd</strong>
            </p>
          </div>
        </div>

        <div className="card">
          <h2>Provisional Standings</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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

        <div className="card">
          <h2>Accounts & Team Names</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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

        <div className="card">
          <h2>Fair Play</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
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
          <button>Back to Predictor</button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}
