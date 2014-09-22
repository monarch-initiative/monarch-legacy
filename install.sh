#!/bin/sh
V=ringojs-0.9
wget http://ringojs.org/downloads/$V.tar.gz
tar -zxvf $V.tar.gz
ln -s $V ringojs
./ringojs/bin/ringo-admin install ringo/stick

CWD=`pwd`
# install phenogrid
if [ ! -d ./widgets/phenogrid ]; then
    cd ./widgets
    git clone https://github.com/monarch-initiative/phenogrid.git
    cd $CWD
fi
