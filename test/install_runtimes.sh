#!/bin/bash -xe

install_app() {
    local arch="$1"
    local app="$2"
    local branch=$3
    install_flatpak "app/$app/$arch/$branch"
}

install_runtime() {
    local arch="$1"
    local runtime="$2"
    local version="$3"
    install_flatpak "runtime/${runtime}/$arch/$version"
}

install_flatpak() {
    local ref="$1"
    if [[ ! -d "$HOME/.local/share/flatpak/$ref" ]]; then
        flatpak install --user --no-deps --assumeyes "$ref"
    fi
}

flatpak remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

install_runtime x86_64 org.freedesktop.Sdk 1.6
install_runtime x86_64 org.freedesktop.Platform 1.6
install_runtime x86_64 org.freedesktop.Sdk 19.08
install_runtime x86_64 org.freedesktop.Platform 19.08
install_app x86_64 io.atom.electron.BaseApp stable
install_app x86_64 org.electronjs.Electron2.BaseApp stable
