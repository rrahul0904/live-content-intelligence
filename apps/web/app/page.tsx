import Link from "next/link";

const signals = [
  ["Chat velocity", 0.84],
  ["Keyword intensity", 0.61],
  ["Emote burst", 0.73],
  ["Sentiment", 0.52],
  ["Audio spike", 0.91],
  ["Viewer spike", 0.68],
  ["Silence burst", 0.34]
] as const;

const scoreHistory = [42, 48, 46, 55, 57, 64, 61, 70, 76, 88, 81, 67];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div>
          <div className="brandMark">LC</div>
          <div className="brand">Live Content<br/>Intelligence</div>
        </div>
        <nav>
          <Link className="active" href="/">Live Streams</Link>
          <a>Clip Review <span className="badge">12</span></a>
          <a>Clip Library</a>
          <a>VOD Scanner</a>
          <a>Content Studio</a>
          <a>Scheduler</a>
        </nav>
        <nav className="bottomNav">
          <Link href="/channels">Channels</Link>
          <a>Operations</a>
          <a>Settings</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">CONTROL ROOM</p>
            <h1>Live Streams</h1>
            <p>Watch the signal engine decide what is worth keeping.</p>
          </div>
          <Link className="primary buttonLink" href="/channels">+ Add channel</Link>
        </header>

        <section className="stats">
          <Metric label="Channels live" value="3 / 10" hint="Pro workspace" />
          <Metric label="Candidates today" value="47" hint="+18% vs yesterday" />
          <Metric label="Approval rate" value="62%" hint="last 100 reviews" />
          <Metric label="Cost / channel hr" value="$0.018" hint="estimated" />
        </section>

        <section className="streamCard">
          <div className="streamHeader">
            <div>
              <div className="live"><span/> LIVE · 02:14:38</div>
              <h2>northstar_live</h2>
              <p>Competitive FPS · 8,412 viewers · Default/FPS hybrid</p>
            </div>
            <div className="scoreBox">
              <span>TRIGGER SCORE</span>
              <strong>81</strong>
              <small>threshold 74</small>
            </div>
          </div>

          <div className="chart" aria-label="recent trigger score">
            {scoreHistory.map((value, index) => (
              <div key={index} className="barWrap">
                <div className="bar" style={{ height: value + "%" }} />
              </div>
            ))}
            <div className="threshold">74 threshold</div>
          </div>

          <div className="signalGrid">
            {signals.map(([name, value]) => (
              <div className="signal" key={name}>
                <div><span>{name}</span><strong>{Math.round(value * 100)}</strong></div>
                <div className="meter"><i style={{ width: value * 100 + "%" }}/></div>
              </div>
            ))}
          </div>

          <div className="reason">
            <div>
              <span className="pulse"/>
              <strong>Candidate detected</strong>
              <p>Audio spike + chat acceleration pushed this moment above the channel threshold.</p>
            </div>
            <button>Review moment →</button>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}
