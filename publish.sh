#!/bin/bash

set -eou pipefail

if [ -z "${1+x}" ]; then
    echo "Must supply builddir."
    exit 1;
fi

# Ensure dir ends in trailing slash for rsync.
builddir="${1%/}/"

webdir=~/web/intro.gigamonkeys.com/
mkdir -p "$webdir"

sha=$(git log --pretty=tformat:%H -1);

stashed="no"
if [ -z "$(git status --porcelain)" ]; then
    stashed="yes"
    git stash push -u
fi

rsync --exclude .git --recursive --delete "$builddir" "$webdir"
cd "$webdir"
git add -A .
git commit -m "Publish $sha" .
git push

if [ "$stashed" == "yes" ]; then
    git stash pop
fi
