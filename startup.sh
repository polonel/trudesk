#!/bin/bash

if [ ! -d /usr/src/trudesk/public/uploads/users ]; then
    echo "Creating Directory..."
    mkdir /usr/src/trudesk/public/uploads/users
fi

if [ ! -f /usr/src/trudesk/public/uploads/users/defaultProfile.jpg ]; then
    echo "Coping defaultProfile.jpg"
    cp /usr/src/trudesk/public/img/defaultProfile.jpg /usr/src/trudesk/public/uploads/users/defaultProfile.jpg
fi

node /usr/src/trudesk/runner.js