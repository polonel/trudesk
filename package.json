{
  "name": "trudesk",
  "version": "1.2.0",
  "private": true,
  "engines": {
    "node": ">=16.0.0"
  },
  "bin": "./app.js",
  "scripts": {
    "start": "node ./app",
    "build": "grunt build",
    "test": "mocha --recursive",
    "lint": "standard | snazzy",
    "format": "prettier-standard \"./*.js\" \"src/*.js\" \"src/**/*.js\" \"src/**/*.jsx\" \"!src/public/js/vendor/**/*.js\" \"!src/public/js/plugins/**/*.js\"",
    "coverage": "nyc --reporter=lcovonly npm run test",
    "codacy": "npm run coverage && bash <(curl -Ls https://coverage.codacy.com/get.sh) report -r ./coverage/lcov.info && rm -rf ./coverage",
    "webpackwatch": "webpack --config webpack.config.js --watch",
    "webpackdev": "webpack --config webpack.config.js",
    "webpackdist": "rimraf public/js/* && webpack --env production --node-env production --config webpack.config.js",
    "snyk-protect": "snyk protect"
  },
  "dependencies": {
    "@elastic/elasticsearch": "8.0.0",
    "@handlebars/allow-prototype-access": "1.0.5",
    "adm-zip": "0.5.9",
    "animejs": "3.0.1",
    "ansi_up": "5.1.0",
    "archiver": "5.3.0",
    "async": "3.2.3",
    "axios": "0.26.0",
    "bcrypt": "5.0.1",
    "body-parser": "1.19.2",
    "busboy": "1.4.0",
    "chance": "1.1.8",
    "cheerio": "1.0.0-rc.10",
    "clone": "2.1.2",
    "clsx": "1.1.1",
    "connect-flash": "0.1.1",
    "connect-mongo": "4.6.0",
    "cookie": "0.4.2",
    "cookie-parser": "1.4.6",
    "csv": "6.0.5",
    "debug": "4.3.3",
    "dive": "0.5.0",
    "email-templates": "8.0.8",
    "express": "4.17.3",
    "express-hbs": "2.4.0",
    "express-session": "1.17.2",
    "fast-csv": "4.3.6",
    "fs-extra": "10.0.0",
    "handlebars": "4.7.7",
    "html-to-text": "8.1.0",
    "imap": "0.8.19",
    "immutable": "4.0.0",
    "imports-loader": "3.1.1",
    "ip-address": "8.1.0",
    "js-string-escape": "1.0.1",
    "jsonwebtoken": "8.5.1",
    "ldapjs": "2.3.1",
    "lodash": "4.17.21",
    "mailparser": "3.4.0",
    "marked": "4.0.12",
    "matchdep": "2.0.0",
    "memoize-one": "6.0.0",
    "mkdirp": "1.0.4",
    "mobx": "6.3.13",
    "mobx-react": "7.2.1",
    "moment": "2.29.2",
    "moment-duration-format": "2.3.2",
    "moment-timezone": "0.5.34",
    "mongoose": "6.2.2",
    "mongoose-autopopulate": "0.16.0",
    "mongoose-lean-virtuals": "0.9.0",
    "nconf": "0.11.3",
    "netmask": "2.0.2",
    "node-cache": "5.1.2",
    "node-sass": "7.0.1",
    "nodemailer": "6.7.2",
    "object-hash": "2.2.0",
    "passport": "0.5.2",
    "passport-http": "0.3.0",
    "passport-jwt": "4.0.0",
    "passport-local": "1.0.0",
    "passport-totp": "0.0.2",
    "passport.socketio": "3.7.0",
    "pdfkit": "0.13.0",
    "piexifjs": "1.0.6",
    "pm2": "5.1.2",
    "prop-types": "15.8.1",
    "react": "17.0.2",
    "react-colorful": "5.5.1",
    "react-dom": "17.0.2",
    "react-html-parser": "2.0.2",
    "react-infinite-scroller": "1.2.5",
    "react-redux": "7.2.6",
    "redis": "4.0.3",
    "redux": "4.1.2",
    "redux-actions": "2.6.5",
    "redux-define": "1.1.1",
    "redux-saga": "1.1.3",
    "redux-saga-thunk": "0.7.3",
    "request": "2.88.0",
    "rimraf": "3.0.2",
    "sanitize-html": "2.7.0",
    "script-loader": "0.7.2",
    "semver": "7.3.5",
    "serve-favicon": "2.5.0",
    "socket.io": "4.4.1",
    "socket.io-client": "4.4.1",
    "svg-captcha": "1.4.0",
    "tail": "2.2.4",
    "tar": "6.1.11",
    "thirty-two": "1.0.2",
    "uglify-js": "3.15.1",
    "unzipper": "0.10.11",
    "util": "0.12.4",
    "velocity-react": "1.4.3",
    "winston": "3.6.0",
    "xss": "1.0.10"
  },
  "devDependencies": {
    "@babel/core": "7.17.4",
    "@babel/eslint-parser": "7.17.0",
    "@babel/plugin-proposal-class-properties": "7.16.7",
    "@babel/plugin-proposal-decorators": "7.17.2",
    "@babel/preset-env": "7.16.11",
    "@babel/preset-react": "7.16.7",
    "@commitlint/cli": "16.2.1",
    "@commitlint/config-conventional": "16.2.1",
    "@semantic-release/changelog": "6.0.1",
    "@semantic-release/git": "10.0.1",
    "@semantic-release/npm": "9.0.0",
    "babel-eslint": "10.0.1",
    "babel-loader": "8.2.3",
    "chai": "*",
    "codacy-coverage": "3.0.0",
    "cross-env": "7.0.3",
    "css-loader": "6.6.0",
    "eslint": "8.9.0",
    "eslint-config-angular": "0.5.0",
    "eslint-config-prettier": "8.3.0",
    "eslint-config-standard": "16.0.3",
    "eslint-import-resolver-webpack": "0.13.2",
    "eslint-plugin-angular": "4.1.0",
    "eslint-plugin-import": "2.25.4",
    "eslint-plugin-node": "11.1.0",
    "eslint-plugin-prettier": "4.0.0",
    "eslint-plugin-promise": "6.0.0",
    "eslint-plugin-react": "7.28.0",
    "eslint-plugin-standard": "5.0.0",
    "exports-loader": "3.1.0",
    "expose-loader": "3.1.0",
    "grunt": "1.4.1",
    "grunt-contrib-cssmin": "4.0.0",
    "grunt-contrib-uglify": "5.0.1",
    "grunt-contrib-watch": "1.1.0",
    "grunt-express-server": "0.5.4",
    "grunt-htmlhint": "0.9.13",
    "grunt-parallel": "0.5.1",
    "grunt-sass": "3.1.0",
    "grunt-shell": "3.0.1",
    "husky": "7.0.4",
    "lint-staged": "12.3.4",
    "lorem-ipsum": "2.0.4",
    "mini-css-extract-plugin": "2.5.3",
    "mocha": "9.2.2",
    "mocha-lcov-reporter": "1.3.0",
    "nyc": "15.1.0",
    "patch": "0.0.1",
    "prettier-standard": "16.4.1",
    "sass-loader": "12.6.0",
    "semantic-release": "19.0.2",
    "snyk": "1.854.0",
    "standard": "16.0.4",
    "style-loader": "3.3.1",
    "superagent": "7.1.1",
    "supertest": "6.2.2",
    "terser-webpack-plugin": "5.3.1",
    "webpack": "5.69.0",
    "webpack-bundle-analyzer": "4.5.0",
    "webpack-cli": "4.9.2"
  },
  "release": {
    "prepare": [
      "@semantic-release/changelog",
      "@semantic-release/npm",
      {
        "path": "@semantic-release/git",
        "message": "chore(release): ${nextRelease.version} \n\n${nextRelease.notes}"
      }
    ],
    "publish": [
      "@semantic-release/github"
    ]
  },
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "linters": {
      "*.js": [
        "prettier-standard",
        "git add"
      ]
    },
    "ignore": [
      "public/js/*.js",
      "src/public/js/vendor/**/*.min.js"
    ]
  },
  "commitlint": {
    "extends": [
      "@commitlint/config-conventional"
    ]
  },
  "standard": {
    "ignore": [
      "/public/",
      "/mobile/",
      "/src/public/js/plugins/",
      "/src/public/js/vendor/"
    ],
    "globals": [
      "angular",
      "define",
      "MG",
      "Snackbar",
      "ROLES",
      "io",
      "d3",
      "History"
    ]
  },
  "prettier": {
    "printWidth": 120,
    "singleQuote": true
  },
  "config": {
    "blanket": {
      "pattern": "src",
      "data-cover-never": [
        "node_modules",
        "tests"
      ],
      "data-cover-reporter-options": {
        "shortnames": true
      }
    }
  },
  "snyk": true
}
