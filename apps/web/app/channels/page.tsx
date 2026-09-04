import Link from "next/link";
import { ChannelManager } from "../../components/channel-manager";

export const metadata = {
  title: "Channels · Live Content Intelligence"
};

export default function ChannelsPage() {
  return (
    <main className="channelsShell">
      <header className="channelsHeader">
        <div>
          <Link href="/" className="backLink">← Control room</Link>
          <p className="eyebrow">TWITCH CONTROL PLANE</p>
          <h1>Channels</h1>
          <p>Connect, discover, and configure the streams the detector should watch.</p>
        </div>
      </header>
      <ChannelManager />
    </main>
  );
}
