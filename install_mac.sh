#!/bin/sh
V=ringojs-0.9
curl -O http://ringojs.org/downloads/$V.tar.gz
tar -zxvf $V.tar.gz
ln -s $V ringojs
./ringojs/bin/ringo-admin install ringo/stick
if [ ! -d ./widgets/phenogrid ]; then
    cd ./widgets
    git clone https://github.com/monarch-initiative/phenogrid.git
    cd $CWD
fi
