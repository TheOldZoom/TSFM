# TSFM

> Your Last.fm. Your terminal.

TSFM is an open-source Last.fm CLI built with TypeScript and Bun.

It is a complete recoding of [GoFM](https://github.com/TheOldZoom/gofm), originally written in Go. TSFM keeps the original idea while rebuilding it with a modern TypeScript architecture and a focus on a better CLI experience.

## Why TSFM?

GoFM started as a simple way to interact with Last.fm from the terminal.

TSFM is the continuation of that idea.

Instead of opening a browser just to check your recent tracks, look at your listening statistics, or explore your music, TSFM lets you do it directly from your terminal.

The project is being rebuilt from the ground up in TypeScript and Bun, giving it a cleaner architecture and making it easier to expand with new features.

## How does it work?

Connect TSFM to your Last.fm account and start using it from your terminal.

```bash
tsfm setup
```

Then you can view your recent tracks:

```bash
tsfm recent
```

Check your top artists:

```bash
tsfm top artists
```

Or get information about your Last.fm account:

```bash
tsfm user
```

TSFM can also provide machine-readable output for scripts and other tools.

```bash
tsfm recent --json
```

## Features

- Last.fm integration
- Recoded from GoFM
- Recent tracks
- Currently playing track
- User information
- Top artists
- Top tracks
- Top albums
- Listening statistics
- Trending music
- Music discovery
- User comparisons
- JSON output
- CSV output
- Local caching
- Interactive terminal UI
- Keyboard-focused
- Open Source!!

## Terminal First

TSFM is designed to feel at home in the terminal.

Instead of opening a browser and navigating through Last.fm, you can quickly check your music with a command:

```text
$ tsfm recent

  NOW PLAYING

  Artist Name
  Track Name
```

Commands are designed to be short, predictable, and easy to remember.

## Configuration

TSFM stores its configuration locally using the standard XDG configuration directory.

```text
~/.config/tsfm/
```

You can configure TSFM interactively:

```bash
tsfm setup
```

Environment variables can also be used for scripts and automated environments.

## Roadmap

TSFM is still being built.

Check out the [Roadmap](./roadmap.md) for more information about what's planned and what's currently being worked on.

## Contributing

TSFM is open source, and contributions are more than welcome.

It can be any kind of contribution: a bug fix, a new feature, a documentation improvement, or even just an idea.

Feel free to open an issue or submit a pull request.

## License

TSFM is licensed under the **MIT** license.

See [LICENSE](./LICENSE) for more information.

## TSFM

> _GoFM, rebuilt for TypeScript._
