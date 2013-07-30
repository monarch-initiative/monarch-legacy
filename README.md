## Quickstart

Just type

    ./install.sh

Then start the server:

    ./start-server.sh

You're done!

Then navigate to a disease page. E.g.

http://127.0.0.1:8282/disease/DOID_14692


## Step by step

1. Install RingoJS - http://ringojs.org

2. Install stick

    ringo-admin install ringo/stick

3. Run app

    ringo lib/monarch/web/webapp_launcher.js --port 8282

4. "browse"

E.g.

    http://127.0.0.1:8080/disease/DOID_14692

More to come...