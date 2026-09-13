# TizenCobalt

Optimized mod of [TizenTubeCobalt](https://github.com/reisxd/TizenTubeCobalt) by `@reisxd`.

### Key Optimizations & Features
- **Slim Runtime:** Cut upstream JS from ~25,000 lines down to 428 lines, eliminating CPU bloat.
- **Hardware Tunneling:** Native Starboard `ForceTunnelMode` routes 4K AV1 directly to display silicon.
- **Ultra-Low CPU:** Uses only **~5.8% total chip power** on 4-core TV SoCs during 4K playback.
- **Stable RAM:** Rock-solid footprint anchored between **200 MB – 400 MB** with zero memory leaks.
- **Jank Elimination:** Removed synchronous `JSON.stringify` on shelves for fluid 60 FPS UI.
- **Zero Telemetry:** Binary-level null routing of Google crashpad, analytics, and tracking.

### Credits & License
Based on Cobalt (Google) and TizenTubeCobalt (`@reisxd`). Licensed under BSD-3-Clause.
