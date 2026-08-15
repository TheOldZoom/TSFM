# `scrobble`

**Aliases:** `sb`

Scrobble a track, or update now-playing status (defaults to current track)

**Usage**
```
tsfm scrobble [--artist "<artist>" --track "<track>"] [--album "<album>"] [--playing-now] [-y|--yes]
```

**Flags**

| Flag | Description |
| :-- | :-- |
| `--artist "<artist>"` | Artist name (or first positional arg); defaults to your current/last played track |
| `--track "<track>"` | Track name (or remaining positional args) |
| `--album "<album>"` | Override the album name |
| `--playing-now` | Update now-playing status instead of scrobbling |
| `-y, --yes` | Skip the confirmation prompt |

