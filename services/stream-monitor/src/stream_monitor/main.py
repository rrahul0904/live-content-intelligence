import asyncio
import os
import socket

async def run() -> None:
    worker_id = os.getenv("WORKER_ID", socket.gethostname())
    print(f"stream-monitor worker={worker_id} started")
    # Phase 1: replace this heartbeat shell with durable queue leasing.
    while True:
        await asyncio.sleep(30)
        print(f"stream-monitor worker={worker_id} heartbeat")

if __name__ == "__main__":
    asyncio.run(run())
