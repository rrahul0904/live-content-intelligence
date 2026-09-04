"use client";

import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_CONTROL_API_URL ?? "http://localhost:3001";

interface StreamSummary {
  id: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
}

interface Channel {
  id: string;
  providerChannelId: string;
  login: string;
  displayName: string;
  profileImageUrl?: string | null;
  description?: string | null;
  preset: string;
  threshold: number;
  enabled: boolean;
  live: boolean;
  stream: StreamSummary | null;
}

interface ChannelList {
  plan: string;
  channelLimit: number;
  enabledCount: number;
  channels: Channel[];
}

interface SearchResult {
  providerChannelId: string;
  login: string;
  displayName: string;
  profileImageUrl?: string;
  description?: string;
  broadcasterType?: string;
  live: boolean;
  stream: StreamSummary | null;
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body?.error === "string" ? body.error : "Request failed";
    throw new Error(message);
  }
  return body as T;
}

export function ChannelManager() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [data, setData] = useState<ChannelList | null>(null);
  const [login, setLogin] = useState("");
  const [preset, setPreset] = useState("default");
  const [found, setFound] = useState<SearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const me = await fetch(API + "/v1/me", { credentials: "include" });
    if (me.status === 401) {
      setConnected(false);
      setData(null);
      return;
    }
    await responseJson(me);
    setConnected(true);

    const channels = await fetch(API + "/v1/channels", {
      credentials: "include"
    });
    setData(await responseJson<ChannelList>(channels));
  }, []);

  useEffect(() => {
    load().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Unable to load channels");
      setConnected(false);
    });
  }, [load]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFound(null);
    try {
      const response = await fetch(
        API + "/v1/channels/search?login=" + encodeURIComponent(login.trim()),
        { credentials: "include" }
      );
      setFound(await responseJson<SearchResult>(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!found) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(API + "/v1/channels", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login: found.login, preset })
      });
      await responseJson(response);
      setFound(null);
      setLogin("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add channel");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(channel: Channel) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(API + "/v1/channels/" + channel.id, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !channel.enabled })
      });
      await responseJson(response);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update channel");
    } finally {
      setBusy(false);
    }
  }

  async function remove(channel: Channel) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(API + "/v1/channels/" + channel.id, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) await responseJson(response);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove channel");
    } finally {
      setBusy(false);
    }
  }

  if (connected === null) {
    return <div className="panel emptyState">Loading Twitch connection…</div>;
  }

  if (!connected) {
    return (
      <div className="panel connectPanel">
        <div className="connectIcon">↗</div>
        <div>
          <p className="eyebrow">TWITCH CONNECTION</p>
          <h2>Connect Twitch to start monitoring</h2>
          <p>
            We use Twitch OAuth for identity and user-authorized clip creation.
            Your access and refresh tokens are encrypted before storage.
          </p>
          <a className="primary buttonLink" href={API + "/auth/twitch/start"}>
            Continue with Twitch
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="channelManager">
      <section className="panel addPanel">
        <div className="panelTitle">
          <div>
            <p className="eyebrow">CHANNEL DISCOVERY</p>
            <h2>Add a Twitch channel</h2>
          </div>
          <div className="quota">
            {data?.enabledCount ?? 0} / {data?.channelLimit ?? "–"} monitored
          </div>
        </div>

        <form className="channelSearch" onSubmit={search}>
          <input
            aria-label="Twitch channel login"
            placeholder="e.g. twitchdev"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            disabled={busy}
          />
          <select
            aria-label="Detector preset"
            value={preset}
            onChange={(event) => setPreset(event.target.value)}
            disabled={busy}
          >
            <option value="default">Default</option>
            <option value="small-streamer">Small streamer</option>
            <option value="fps">FPS</option>
            <option value="moba">MOBA</option>
            <option value="strategy">Strategy / Chess</option>
            <option value="irl">IRL</option>
            <option value="variety">Variety / Chatting</option>
            <option value="sports">Sports</option>
          </select>
          <button className="primary" disabled={busy || login.trim().length < 2}>
            {busy ? "Checking…" : "Find channel"}
          </button>
        </form>

        {found && (
          <div className="foundChannel">
            <div className="channelIdentity">
              {found.profileImageUrl ? (
                <img src={found.profileImageUrl} alt="" />
              ) : (
                <div className="avatarFallback">{found.displayName.slice(0, 1)}</div>
              )}
              <div>
                <div className={found.live ? "live compactLive" : "offline"}>
                  <span /> {found.live ? "LIVE" : "OFFLINE"}
                </div>
                <strong>{found.displayName}</strong>
                <small>@{found.login}</small>
              </div>
            </div>
            <div className="foundMeta">
              {found.stream ? (
                <>
                  <strong>{found.stream.gameName || "Live"}</strong>
                  <span>{found.stream.viewerCount.toLocaleString()} viewers</span>
                </>
              ) : (
                <span>Will be detected when the channel goes live.</span>
              )}
            </div>
            <button className="secondary" onClick={add} disabled={busy}>
              Add to monitoring
            </button>
          </div>
        )}

        {error && <div className="errorBanner">{error}</div>}
      </section>

      <section className="panel">
        <div className="panelTitle">
          <div>
            <p className="eyebrow">MONITORING REGISTRY</p>
            <h2>Your channels</h2>
          </div>
          <button className="ghostButton" onClick={() => load()} disabled={busy}>
            Refresh live status
          </button>
        </div>

        {!data?.channels.length ? (
          <div className="emptyState">No channels configured yet.</div>
        ) : (
          <div className="channelTable">
            {data.channels.map((channel) => (
              <article className="channelRow" key={channel.id}>
                <div className="channelIdentity">
                  {channel.profileImageUrl ? (
                    <img src={channel.profileImageUrl} alt="" />
                  ) : (
                    <div className="avatarFallback">{channel.displayName.slice(0, 1)}</div>
                  )}
                  <div>
                    <div className={channel.live ? "live compactLive" : "offline"}>
                      <span /> {channel.live ? "LIVE" : "OFFLINE"}
                    </div>
                    <strong>{channel.displayName}</strong>
                    <small>@{channel.login}</small>
                  </div>
                </div>
                <div className="rowMetric">
                  <span>PRESET</span>
                  <strong>{channel.preset}</strong>
                </div>
                <div className="rowMetric">
                  <span>THRESHOLD</span>
                  <strong>{channel.threshold}</strong>
                </div>
                <div className="rowMetric wideMetric">
                  <span>NOW</span>
                  <strong>{channel.stream?.gameName ?? "Not live"}</strong>
                  <small>
                    {channel.stream
                      ? channel.stream.viewerCount.toLocaleString() + " viewers"
                      : "Waiting for stream"}
                  </small>
                </div>
                <div className="rowActions">
                  <button className="ghostButton" onClick={() => toggle(channel)} disabled={busy}>
                    {channel.enabled ? "Pause" : "Enable"}
                  </button>
                  <button className="dangerButton" onClick={() => remove(channel)} disabled={busy}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
