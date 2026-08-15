# `tag`

**Aliases:** `tg`

Add or remove tags on a track (defaults to now playing, or your last played)

**Usage**
```
tsfm tag <add|remove> [--artist "<artist>" --track "<track>"] --tags "tag1,tag2"
```

**Flags**

| Flag | Description |
| :-- | :-- |
| `--artist "<artist>"` | Artist name (or first positional arg); defaults to your current/last played track |
| `--track "<track>"` | Track name (or remaining positional args) |
| `--tags "tag1,tag2"` | Comma-separated tags to add, up to 10 (required for `add`) |
| `--tag "tagname"` | Single tag to remove (required for `remove`) |

