# TSFM Roadmap

TSFM is built incrementally. Each phase should leave the project in a usable state.

## Phase 1 — Foundation

- [x] Set up Bun + TypeScript project
- [x] Set up project structure
- [x] Set up CLI entrypoint
- [x] Add command system
- [x] Add configuration system
- [x] Add environment variable handling
- [x] Add logging
- [x] Add error handling

**Goal:** TSFM has a clean foundation and can run as a basic CLI.

---

## Phase 2 — Last.fm API

- [x] Create Last.fm API client
- [x] Add API key authentication
- [x] Add typed API responses
- [x] Add API error handling
- [x] Add request timeout handling
- [x] Add retry handling
- [x] Add user API methods
- [x] Add track API methods
- [x] Add artist API methods
- [x] Add album API methods
- [x] Add chart API methods

**Goal:** TSFM has a reliable and reusable Last.fm API layer.

---

## Phase 3 — Configuration

- [x] Add XDG configuration support
- [x] Add YAML configuration
- [x] Add configuration schema
- [x] Add configuration validation
- [x] Add Last.fm username configuration
- [x] Add Last.fm API key configuration
- [x] Add `tsfm setup`
- [x] Add `tsfm config`
- [x] Add `tsfm config path`
- [x] Add environment variable overrides

**Goal:** TSFM can be configured and connected to a Last.fm account.

---

## Phase 4 — Core Commands

- [x] Add `tsfm recent`
- [x] Add currently playing detection
- [x] Add recent track information
- [x] Add `--user`
- [x] Add `--limit`
- [x] Add `tsfm user`
- [x] Add user information
- [x] Add `tsfm top`
- [x] Add top artists
- [x] Add top tracks
- [x] Add top albums
- [x] Add time period selection

**Goal:** TSFM can provide the core Last.fm information.

---

## Phase 5 — Terminal UI

- [x] Add formatted terminal output
- [x] Add tables
- [x] Add colors
- [x] Add icons
- [x] Add spinners
- [x] Add loading states
- [x] Add relative timestamps
- [x] Add clean error messages
- [x] Add consistent command formatting
- [x] Add `--no-color`
- [x] Add `--quiet`
- [x] Add `--verbose`

**Goal:** TSFM feels like a polished modern terminal application.

---

## Phase 6 — Output

- [x] Add JSON output
- [x] Add CSV output
- [x] Add `--json`
- [x] Add `--csv`
- [x] Add machine-readable errors
- [x] Separate data from presentation
- [x] Add output formatting system

**Goal:** TSFM can be used both interactively and in scripts.

---

## Phase 7 — Statistics

- [x] Add `tsfm stats`
- [x] Add weekly statistics
- [x] Add monthly statistics
- [x] Add yearly statistics
- [x] Add overall statistics
- [x] Add play counts
- [x] Add listening time
- [x] Add top artists
- [x] Add top tracks
- [x] Add top albums
- [x] Add listening activity by day
- [x] Add listening activity by hour
- [x] Add listening trends

**Goal:** TSFM can provide detailed listening statistics.

## Phase 8 — Social

- [x] Add `tsfm compare`
- [x] Compare two Last.fm users
- [x] Compare top artists
- [x] Compare top tracks
- [x] Compare top albums
- [x] Find shared artists
- [x] Find shared tracks
- [x] Calculate listening similarity
- [x] Add user discovery

**Goal:** TSFM can compare listening habits between Last.fm users.

---

## Phase 9 — Last.fm Actions

- [x] Add Last.fm session authentication
- [x] Add session management
- [x] Add track loving
- [x] Add track unloving
- [x] Add scrobbling
- [x] Add now-playing updates
- [x] Add tag management
- [x] Add confirmation prompts

**Goal:** TSFM can interact with Last.fm instead of being read-only.

---

## Phase 10 — Data & Export

- [x] Add local cache
- [x] Add cache expiration
- [x] Add offline mode
- [x] Add cache management
- [x] Add listening history storage
- [x] Add history export
- [x] Add statistics export
- [x] Add JSON export
- [x] Add CSV export
- [x] Add M3U playlist export

**Goal:** TSFM can preserve, reuse, and export listening data.

---

## Phase 11 — CLI Experience

- [x] Add command aliases
- [x] Add help command
- [x] Support --help / -h on every command to show its flags and usage
- [x] Improve help output
- [x] Add command suggestions
- [x] Add interactive prompts
- [x] Improve keyboard-driven workflows

**Goal:** Make TSFM fast and pleasant for daily terminal use.

---

## Phase 12 — Distribution

- [ ] Publish npm package
- [ ] Support `npx tsfm`
- [ ] Support `bunx tsfm`
- [ ] Add GitHub Releases
- [ ] Add automated release workflow
- [ ] Add changelog
- [ ] Add installation documentation

**Goal:** Make TSFM easy to install and distribute.

---

## Phase 13 — v1.0

- [ ] Stabilize CLI interface
- [ ] Stabilize configuration format
- [ ] Complete documentation
- [ ] Improve test coverage
- [ ] Add integration tests
- [ ] Fix cross-platform issues
- [ ] Improve API reliability
- [ ] Improve performance
- [ ] Finalize command structure
- [ ] Finalize release process

**Goal:** TSFM is a stable, production-ready Last.fm CLI.

---

## MVP

The first real milestone is:

```text
Last.fm
    ↓
API Client
    ↓
Configuration
    ↓
TSFM CLI
    ↓
┌─────────────────┐
│     recent      │
│      user       │
│       top       │
└─────────────────┘
    ↓
Terminal UI
    ↓
JSON / CSV
```

**MVP = Phases 1–6.**
