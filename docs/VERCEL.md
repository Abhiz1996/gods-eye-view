# Hosted deployment

Import `Abhiz1996/gods-eye-view` into Vercel and use Node.js 24.x. The checked-in
`vercel.json` builds the globe and routes `/api/*` to a Node.js function that reuses
the original data-provider middleware. It does not expose the Vite development
server. The install command skips Puppeteer's unused browser download.

Start without provider keys. The keyless map and public data sources remain
available, subject to the providers' availability and rate limits. Optional voice,
3D imagery, vessel and fire capabilities still require their respective keys.
Provider settings and credential writes are local-only and are not deployed.

Caches live in `/tmp` on Vercel and can disappear when an instance is recycled.
Vessel streaming and accumulated track histories require a persistent server for
reliable continuous operation; do not enable AISStream on this serverless host.
Before adding any paid provider credentials, add authentication and provider-side
quotas as described in `SECURITY.md`. No private keys are included in this deployment.

Validate hosting changes with `node --test scripts/hosted-api.test.mjs` and
`npm run build`. After deployment, check `/api/health`, the browser's map rendering,
and at least one live data endpoint.
