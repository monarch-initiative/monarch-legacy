## Notes for MonarchNG (Next-Generation)

These instructions are transitionally useful, and will be obviated when this code moves into a new repo and has a new webpack configuration generated.

### Terminology

- SPA: Single Page Application
- MonarchNG: Monarch Next-Generation
- USE_SPA=1 Shell variable controlling whether legacy monarch or the SPA (MonarchNG) version is built.


### Front-end Only SPA Development

Normal development of the SPA with webpack-dev-server and no webapp.js

```bash
npm run mng-dev
```


### Front-end Only SPA Production

Normal development of the SPA bundle intended for deployment to a static asset server

```bash
npm run mng-build
```

The following variant will add a symlink within `dist/` that points to `dist/`, which is useful for local simulation/exercise of the built bundle.

```bash
npm run mng-build-with-symlink
http-server -c-1 dist/
```



### Front-end SPA with legacy backend support

Runs webpack-dev-server for front-end, with webapp.js acting as legacy server.

```bash
USE_SPA=1 npm run mng-legacy-dev
```

This is the equivalent of the old:

```bash
USE_SPA=1 npm run dev
```

### Legacy backend support of SPA

During debugging, it was useful to be able to run the backend separate from the front-end.
Most devs will not use this.

```bash
USE_SPA=1 npm run mng-legacy-backend
```
