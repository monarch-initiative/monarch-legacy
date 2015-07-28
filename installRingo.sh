#!/bin/sh

mkdir -p tools/

if [ -h tools/ringo ]; then
	echo "tools/ringo already installed"
else
	BREWCOMMAND="`which brew`"
	APTGETCOMMAND="`which apt-get`"
	if [ $BREWCOMMAND ]; then
		echo "Mac/Homebrew install"
		RINGOCOMMAND="`which ringo`"
		if [ $RINGOCOMMAND ]; then
			echo "ringojs already installed"
		else
			brew install ringojs
		fi

		ln -fs `which ringo` tools/
		ln -fs `which ringo-admin` tools/
	# elif [ $APTGETCOMMAND ]; then
	#
	#	# Not yet tested. Seth says this will work if apt is configured
	#	# to point to the correct repo.
	#
	# 	sudo apt-get install ringojs
	else
		echo "Default install"
		V=ringojs-0.9
		WGETCOMMAND="`which wget`"

		if [ "$WGETCOMMAND" ]; then
			GETTER="curl --output"
		else
			GETTER="wget --output-document"
		fi

		$GETTER /tmp/$V.tar.gz http://ringojs.org/downloads/$V.tar.gz
		tar -C tools/ -zxvf /tmp/$V.tar.gz
		ln -s `pwd`/tools/$V/bin/ringo tools/ringo
		ln -s `pwd`/tools/$V/bin/ringo-admin tools/ringo-admin
	fi

	tools/ringo-admin install --force ringo/stick
fi
