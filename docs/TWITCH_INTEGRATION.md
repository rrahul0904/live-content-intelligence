# Twitch Integration

## Required capabilities

- OAuth identity
- channel/user lookup
- live stream metadata
- chat/event ingestion
- clip creation for authorized users
- optional event subscription for live/offline transitions

## OAuth

Use authorization-code flow. Never expose the client secret to the browser. Encrypt access and refresh tokens at rest and support token rotation/revocation.

The concrete scopes must be verified against current Twitch documentation before production release because Twitch APIs and scopes can change.

## Clip creation abstraction

The rest of the product should depend on an internal interface:

```ts
interface ClipProvider {
  createClip(input: {
    broadcasterId: string;
    idempotencyKey: string;
  }): Promise<{ externalId: string; url?: string }>;
}
```

That prevents Twitch-specific API details from contaminating detector logic and makes future platforms possible.

## API safety

- global and per-token rate-limit accounting
- exponential backoff with jitter where retry is allowed
- request IDs and structured error categories
- no blind retry of ambiguous mutation outcomes
- reconcile clip creation after timeouts
