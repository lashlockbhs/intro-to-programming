#!/bin/bash

set -eou pipefail

dir=$(basename "$(pwd)")
sha=$(git log --pretty=tformat:%H -1);
webdir=~/web/www.gigamonkeys.com/misc/$dir/

echo -n "Clearing $webdir ... "
if [ -d "$webdir" ]; then
    rm -rf "$webdir";
fi
mkdir -p "$webdir"
echo "ok."

echo -n "Copying files ... "
cp -R "$@" $webdir
echo "ok."

echo -n "Adding to git ... "
cd $webdir
git add -A .
echo "ok."

echo "Committing ... "
git commit -m "Publish $dir $sha" .
echo "ok."

echo "Pushing ... "
git push
echo "ok."
