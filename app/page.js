export default function Home() {
  return (
    <main>
      <div className="container">
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">
          Predict the results. Score the points. Top the leaderboard.
        </p>

        <div className="card">
          <h2>Welcome to The Predictor</h2>
          <p>
            Sign in to make your predictions for the upcoming fixtures.
          </p>

<a href="/login"><button>Sign In</button></a>
        </div>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}
