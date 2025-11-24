# @jsrepo/migrate

Automatically migrate your jsrepo project to the newest version of jsrepo.

```sh
pnpm dlx @jsrepo/migrate v3
```

## Commands

### `v3`

```sh
pnpm dlx @jsrepo/migrate v3
```

- Migrates your `jsrepo-build-config.json` and `jsrepo.json` files into the new `jsrepo.config.ts` file.
- Installs `jsrepo` and the correct formatting transform (if you were using one)
- Builds your registry using both v2 and v3 to ensure compatibility