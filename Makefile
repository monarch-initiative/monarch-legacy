####
#### Development easing.
####

###
### Environment variables.
###

RINGO_MODULE_PATH ?= ../stick/lib
RINGO_BIN ?= ./ringojs/bin/ringo
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
	$(RINGO_BIN) tests/urltester.js -s production -c vocabulary,ontoquest,federation

triples:
	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_production.json conf/rdf-mapping/*-map.json && ./bin/target-ttl-to-owl.sh
##	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_production.json -m conf/rdf-mapping/ncbi-gene-map.json && ./bin/target-ttl-to-owl.sh

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
