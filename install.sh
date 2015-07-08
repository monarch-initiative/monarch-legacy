#!/bin/sh

./installRingo.sh

# Note to phenogrid developers
# Define the environment symbol PHENOGRID_LOCAL_DEV to point to a locally edited
# copy of phenogrid to ensure that your monarch-app is using that copy instead of the
# npm-installed copy.
#
# For example, if phenogrid and monarch-app are siblings on your development machine,
# you can define:
# 	export PHENOGRID_LOCAL_DEV=../phenogrid
# prior to running this install.sh script.
#
#export PHENOGRID_LOCAL_DEV=../phenogrid

if [ $PHENOGRID_LOCAL_DEV ]; then
	echo "Using local phenogrid from: $PHENOGRID_LOCAL_DEV"
	npm link $PHENOGRID_LOCAL_DEV
fi

npm install
gulp assemble
