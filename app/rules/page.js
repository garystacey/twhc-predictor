export default function RulesPage() {
  return (
    <main>
      <div className="container">
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">Competition Rules</p>

        <div className="card">
          <h2>How To Play</h2>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.6",
            }}
          >
            <p>
              Each match week you predict the result of the listed
              Telford & Wrekin Hockey Club fixtures.
            </p>

            <p>
              For every fixture, choose one of:
            </p>

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
              Your points are calculated automatically once the
              actual fixture results have been entered.
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
              Each match week has its own opening time and deadline.
            </p>

            <p>
              The Predictions page will show when the next match
              week opens.
            </p>

            <p>
              You can make or change your selections at any time
              while that match week is open.
            </p>

            <p>
              Once the deadline has passed, predictions are locked
              and can no longer be changed.
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
            <p>
              If you do not submit a prediction for a fixture before
              the deadline, no point can be scored for that fixture.
            </p>

            <p>
              You do not have to predict every fixture, but completing
              all available predictions gives you the best opportunity
              to score points.
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
              Shows each player's total points across the competition.
            </p>

            <p>
              <strong>Weekly Leaderboards</strong>
              <br />
              Shows the points scored in each individual completed
              match week.
            </p>

            <p>
              Previous weekly leaderboards remain available, so you
              can look back at any completed match week.
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
              Predictions are linked to your individual Predictor
              account.
            </p>

            <p>
              Only predictions successfully saved before the relevant
              deadline will count.
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
