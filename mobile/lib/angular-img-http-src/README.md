# angular-img-http-src
Status: Go horse.

## Problem
You used token based auth and you need to serve images from secured routes.

## Solution
Use `http-src` instead of `ng-src` and it will fetch images using the `$http` service - meaning Authorization headers added via interceptors will be present - then build a `Blob` and set the `src` to an [objectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL).
