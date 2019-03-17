#!/bin/bash -xe

if [[ "$USE_DOCKER" = "true" ]]; then
    npm test
else
    sudo docker run --privileged --interactive --tty --volume $(pwd):/code malept/electron-forge-container:latest /bin/bash -c "cd /code &&
        /code/test/ci/install_runtimes.sh &&
        DEBUG=$DEBUG npm test"
fi
