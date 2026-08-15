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

---

## Phase 8 — Discovery

- [ ] Add `tsfm trending`
- [ ] Add trending artists
- [ ] Add trending tracks
- [ ] Add trending albums
- [ ] Add similar artists
- [ ] Add similar tracks
- [ ] Add artist tags
- [ ] Add track tags
- [ ] Add album tags
- [ ] Add music recommendations

**Goal:** TSFM can be used to discover music as well as analyze it.

---

## Phase 9 — Social

- [ ] Add `tsfm compare`
- [ ] Compare two Last.fm users
- [ ] Compare top artists
- [ ] Compare top tracks
- [ ] Compare top albums
- [ ] Find shared artists
- [ ] Find shared tracks
- [ ] Calculate listening similarity
- [ ] Add user discovery

**Goal:** TSFM can compare listening habits between Last.fm users.

---

## Phase 10 — Last.fm Actions

- [ ] Add Last.fm session authentication
- [ ] Add session management
- [ ] Add track loving
- [ ] Add track unloving
- [ ] Add scrobbling
- [ ] Add now-playing updates
- [ ] Add tag management
- [ ] Add confirmation prompts

**Goal:** TSFM can interact with Last.fm instead of being read-only.

---

## Phase 11 — Data & Export

- [ ] Add local cache
- [ ] Add cache expiration
- [ ] Add offline mode
- [ ] Add cache management
- [ ] Add listening history storage
- [ ] Add history export
- [ ] Add statistics export
- [ ] Add JSON export
- [ ] Add CSV export
- [ ] Add M3U playlist export

**Goal:** TSFM can preserve, reuse, and export listening data.

---

## Phase 12 — CLI Experience

- [ ] Add command aliases
- [ ] Add command suggestions
- [ ] Add interactive prompts
- [ ] Add shell completion
- [ ] Add Bash completion
- [ ] Add Zsh completion
- [ ] Add Fish completion
- [ ] Add man page
- [ ] Improve help output
- [ ] Improve keyboard-driven workflows

**Goal:** Make TSFM fast and pleasant for daily terminal use.

---

## Phase 13 — Distribution

- [ ] Publish npm package
- [ ] Support `npx tsfm`
- [ ] Support `bunx tsfm`
- [ ] Add compiled binaries
- [ ] Add Linux builds
- [ ] Add macOS builds
- [ ] Add Windows builds
- [ ] Add GitHub Releases
- [ ] Add automated release workflow
- [ ] Add changelog
- [ ] Add installation documentation

**Goal:** Make TSFM easy to install and distribute.

---

## Phase 14 — v1.0

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
