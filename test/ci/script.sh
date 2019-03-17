#!/bin/bash -e

if [[ "$USE_DOCKER" = "true" ]]; then
    sudo docker run --privileged --interactive --tty --volume $(pwd):/code malept/electron-forge-container:latest /bin/bash -c "cd /code &&
        dbus-daemon --system &&
        /code/test/ci/install_runtimes.sh &&
        DEBUG=$DEBUG npm test"
else
    npm test
fi
