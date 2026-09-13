# TizenCobalt

Optimized mod of [TizenTubeCobalt](https://github.com/reisxd/TizenTubeCobalt) by `@reisxd`.

### Key Optimizations & Features
- **Slim Runtime:** Cut upstream JS from ~25,000 lines to ~260 lines, eliminating CPU-heavy bloat.
- **Hardware Tunneling:** Native Starboard `ForceTunnelMode` routes 4K AV1 directly to display silicon.
- **Ultra-Low CPU:** Drops total chip usage to **~5.8%** on 4-core TV SoCs during 4K playback.
- **Stable RAM:** Rock-solid footprint anchored between **200 MB – 400 MB** with zero leaks.
- **Jank Elimination:** Removed synchronous `JSON.stringify` on shelves for fluid 60 FPS UI.
- **Zero Telemetry:** Binary-level null routing of Google crashpad, analytics, and tracking.

### Credits & License
Based on Cobalt (Google) and TizenTubeCobalt (`@reisxd`). Licensed under BSD-3-Clause.
