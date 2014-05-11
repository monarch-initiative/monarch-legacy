####
#### Development easing.
####

###
### Environment variables.
###

RINGO_MODULE_PATH ?= ../stick/lib
## TODO/BUG: highly non-canonical location--should be passed as
## variable, not hard-coded.
RINGO_BIN ?= ./ringojs/bin/ringo
## Workaround for the above.
RINGO_CLI_BIN ?= /usr/bin/ringo
RINGO_PORT ?= 8080

###
### Tests
###

TESTS = apitest urltester

test: $(patsubst %, test-%, $(TESTS))
production-test: $(patsubst %, production-test-%, $(TESTS))

test-%:
	$(RINGO_BIN) tests/$*.js

production-test-%:
	$(RINGO_BIN) tests/$*.js -s production

nif-production-url-test:
	$(RINGO_BIN) tests/urltester.js -s production -c vocabulary,ontoquest,federation,monarch

triples:
	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_production.json conf/rdf-mapping/*-map.json && ./bin/target-ttl-to-owl.sh
target/%.ttl:
	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_production.json conf/rdf-mapping/$*-map.json && ./bin/target-ttl-to-owl.sh

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
.PHONY: cli-launch-dev
cli-launch-dev:
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher_dev.js --port=$(RINGO_PORT)
.PHONY: cli-launch
cli-launch:
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher.js --port=$(RINGO_PORT)
