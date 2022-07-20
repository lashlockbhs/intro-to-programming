#!/bin/bash

set -eou pipefail
set -x

# Ensure dir ends in trailing slash for rsync.
builddir="${1%/}/"

webdir=~/web/intro.gigamonkeys.com/

sha=$(git log --pretty=tformat:%H -1);

mkdir -p "$webdir"
rsync --exclude .git --recursive --delete --verbose "$builddir" "$webdir"
cd "$webdir"
git add -A .
git commit -m "Publish $sha" .
git push
