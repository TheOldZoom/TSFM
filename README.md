# TSFM

> Your Last.fm, in the terminal

TSFM is a small open-source CLI I built with TypeScript and Bun. It's a fast way to check your music and listening history without opening a browser.

## Why I made this

I got tired of opening a Last.fm tab just to see what I'd been listening to. Now I don't. I just run a command.

## Install

You'll need Bun or npm on your computer.

With bun:

```bash
bun add -g @theoldzoom/tsfm
```

With npm:

```bash
npm install -g @theoldzoom/tsfm
```

Make sure you use `-g` (global) so it's installed everywhere, not just one folder.

The package is called `@theoldzoom/tsfm`, but once it's installed, you just type `tsfm` to use it.

## Getting started

Not sure what to run? Just type `tsfm` by itself. It'll show you every command and ask which one you want.

First, connect your account:

```bash
tsfm setup
```

Then you're good to go. A few things to try:

```bash
tsfm recent          # what you've been playing
tsfm top artists     # your top artists
tsfm user            # your profile
```

Want JSON instead? Just add `--json` to most commands:

```bash
tsfm recent --json
```

## What it can do

- See your recent tracks, and what's playing right now
- Check your top artists, tracks, and albums
- Look at your listening stats
- Compare your listening with someone else's
- Get JSON or CSV output if you want to use it somewhere else
- Fast, keyboard-only, stays in the terminal

Want the full list, with every flag explained? Check out [docs/commands](./docs/commands).

## Settings

Your config is saved at `~/.config/tsfm.yaml`. Run `tsfm setup` again anytime you want to change something.

## Contributing

Found a bug, or have an idea? Open an issue or send a pull request. Help is always welcome.

## License

MIT. See [LICENSE](./LICENSE) for the details.
