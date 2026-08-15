# TSFM

> Your Last.fm, in the terminal.

TSFM is a small open-source CLI built with TypeScript and Bun. It's a fast way to check your music and listening history without opening a browser.

Why? I got tired of opening a Last.fm tab just to see what I'd been listening to. Now I don't. I just run a command.

## Demo

[![Watch the demo](https://img.youtube.com/vi/rA0nFo1N1Ik/maxresdefault.jpg)](https://youtu.be/rA0nFo1N1Ik)

## Install

You'll need [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) with npm installed.

### Bun

```bash
bun add -g @theoldzoom/tsfm
```

### npm

```bash
npm install -g @theoldzoom/tsfm
```

Make sure you use `-g` (global) so TSFM is available from anywhere.

The package is called `@theoldzoom/tsfm`, but once it's installed, you just type:

```bash
tsfm
```

## Getting started

Not sure what to run? Just type `tsfm` by itself. It'll show you the available commands and guide you through the setup.

First, connect your Last.fm account:

```bash
tsfm setup
```

Then you're good to go.

A few things to try:

```bash
tsfm recent
tsfm top artists
tsfm user
```

Want JSON instead? Add `--json` to most commands:

```bash
tsfm recent --json
```

## Last.fm API key

TSFM uses the Last.fm API to access your listening data.

Before running `tsfm setup`, you'll need a Last.fm API key.

### 1. Create a Last.fm API application

Go to [Last.fm's API application page](https://www.last.fm/api/account/create) and sign in to your Last.fm account.

Create a new application with:

- **Application name:** `TSFM`
- **Application description:** `A terminal client for Last.fm`

After creating the application, Last.fm will provide you with an **API Key** and **Shared Secret**.

### 2. Configure TSFM

Run:

```bash
tsfm setup
```

Follow the prompts and enter your API key when requested.

Your TSFM configuration is stored locally at:

```text
~/.config/tsfm.yaml
```

You can run `tsfm setup` again at any time to change your configuration.

## Commands

### Recent tracks

See your recently played tracks:

```bash
tsfm recent
```

### Top artists

See your most-played artists:

```bash
tsfm top artists
```

### Top tracks

```bash
tsfm top tracks
```

### Top albums

```bash
tsfm top albums
```

### User profile

View your Last.fm profile information:

```bash
tsfm user
```

### JSON output

Most commands support JSON output:

```bash
tsfm recent --json
```

This makes TSFM useful for scripts and other programs.

### CSV output

Commands that support CSV output can be used with:

```bash
tsfm recent --csv
```

## What it can do

- See your recent tracks and what's playing right now
- Check your top artists, tracks, and albums
- View your listening statistics
- Compare your listening with someone else's
- Get JSON output for scripts and applications
- Get CSV output for data processing
- Fast and keyboard-only
- Runs entirely from the terminal

For the complete list of commands and flags, see [docs/commands](./docs/commands).

## Requirements

- Bun or Node.js
- A Last.fm account
- A Last.fm API key

## Contributing

Found a bug or have an idea?

Open an issue or submit a pull request. Contributions are always welcome.

If you're making a larger change, opening an issue first is recommended so we can discuss the idea before you start working on it.

## License

MIT. See [LICENSE](./LICENSE) for details.
