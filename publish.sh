#!/bin/bash

set -eou pipefail
set -x

sha=$(git log --pretty=tformat:%H -1);
webdir=~/web/intro.gigamonkeys.com/

mkdir -p "$webdir"
rsync --recursive --relative --delete --verbose "$@" $webdir
cd $webdir
git add -A .
git commit -m "Publish $sha" .
git push
