# `export`

**Aliases:** `exp`

Export history, stats, or top lists to JSON, CSV, or M3U

**Usage**
```
tsfm export <history|stats|top-artists|top-tracks|top-albums> --format <json|csv|m3u> --output <path>
```

**Flags**

| Flag | Description |
| :-- | :-- |
| `--format <json|csv|m3u>` | Output format; m3u only applies to track-based exports (default: json) |
| `--output <path>` | File path to write to (required) |
| `--user <name>` | Last.fm username (defaults to your configured username) |
| `--period <period>` | overall, 7day, 1month, 3month, 6month, or 12month (default: overall) |
| `--limit <n>` | Number of items to export (default: 50) |

