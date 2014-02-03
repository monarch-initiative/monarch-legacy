####
#### Development easing.
####

###
### Environment variables.
###

RINGO_MODULE_PATH ?= ../stick/lib
RINGO_BIN ?= /usr/bin/ringo
RINGO_PORT ?= 8080

###
### Documentation.
###

.PHONY: docs
docs:
	naturaldocs --rebuild-output --input lib/monarch --project lib/.naturaldocs_project/ --output html docs/

###
### Deployment.
###

deploy: origin-push heroku-deploy

origin-push:
	git push origin master

## cjm: http://secret-harbor-1370.herokuapp.com/
heroku-create:
	heroku create --stack cedar --buildpack https://github.com/cmungall/heroku-buildpack-ringojs-jdk7.git --remote monarch-heroku
heroku-deploy:
	git push monarch-heroku master

app-engine:
	ringo-admin create --google-appengine gae

## Setup portable Ubuntu environment. -SJC
.PHONY: cli-launch
cli-launch:
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_BIN) ./lib/monarch/web/webapp_launcher_dev.js --port=$(RINGO_PORT)
#	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_BIN) ./lib/monarch/web/webapp_launcher.js --port=$(RINGO_PORT)
