'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');

gulp.task('server', [], function() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  var args = minimist(process.argv.slice(2));
  browserSync.init({
    server: {
      baseDir: '',
      https: true,
      online: true,
      routes: {
        '/': ''
      }
    },
    ghostMode: false,
    host: args.host || 'crm-sdk.five9lab.com',
   	port: args.port || '443',
    open: false,
    startPath: 'iframe_api_v2.html'
  });
});
