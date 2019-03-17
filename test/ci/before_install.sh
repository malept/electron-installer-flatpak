#!/bin/bash -e

if [[ "$USE_DOCKER" = "true" ]]; then
    docker pull malept/electron-forge-container:latest
else
    sudo add-apt-repository -y ppa:alexlarsson/flatpak
    sudo apt update
    sudo apt install --no-install-recommends -y flatpak-builder
    ./test/ci/install_runtimes.sh
fi
