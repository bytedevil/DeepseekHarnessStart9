# Updating the upstream version

Upstream is [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness), released
to npm as [`@deepseek-ai/dsh`](https://www.npmjs.com/package/@deepseek-ai/dsh). This package builds its
own image and installs that CLI globally into it, so "upstream" means the npm version, not a Docker tag.

## Determining the upstream version

```sh
npm view @deepseek-ai/dsh version
```

The current pin lives in `Dockerfile`, in the `npm install -g @deepseek-ai/dsh@<version>` line.

`dsh` publishes prereleases only, and `npm view` reports the newest one, so the pin is normally a
release-candidate tag.

## Applying the bump

- Edit the version in the `npm install -g @deepseek-ai/dsh@<version>` line in `Dockerfile`.
- Bump `version` in `startos/versions/current.ts` and write its `releaseNotes` for all five locales.
- Rebuild and open the web interface. The two platform binaries the image installs by hand — ripgrep
  and landlock-run — are resolved at build time from their parent packages' `optionalDependencies`, so
  a bump that moves either one is picked up automatically, but only the build proves it: exercise the
  agent's bash and grep tools before releasing.
