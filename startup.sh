#!/bin/bash

if [! -f /usr/src/trudesk/public/uploads/defaultProfile.jpg ]; then
    cp /usr/src/trudesk/public/img/defaultProfile.jpg /usr/src/trudesk/public/uploads/defaultProfile.jpg
fi

node /usr/src/trudesk/runner.js