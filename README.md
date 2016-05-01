# Bill Tribble Site

Built around a gulpfile that compiles everything on save and serves through browsersync. To run locally, clone and run:

```
$ npm install
$ gulp
```

If you make changes to files without gulp running, running `gulp compile` will compile JS, Jade and SASS in one task.

`gulp build` compiles, concats and minifies everything to the rel folder. Whether app serves from `root` or `rel` is determined by environment in `server.js`. 
