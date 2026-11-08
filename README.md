# pxxl-xray-node

Minimal Node deployment for a VLESS + WebSocket node on Pxxl (free tier).

- `package.json` — Node detection, `npm start` runs the node.
- `setup.js` — downloads the official Xray release zip and unpacks the binary.
- `server.js` — reads `UUID` / `WSPATH` / `PORT` from the environment and runs Xray.

No secrets are committed here. Set `UUID` and `WSPATH` as environment
variables in the Pxxl dashboard. TLS is terminated at the Pxxl edge;
inside the container the traffic is plain WebSocket.
