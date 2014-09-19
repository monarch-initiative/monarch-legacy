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

APITESTS = apitest literature-test class-info-test disease-phenotype-test
TESTS = $(APITESTS) urltester

test: $(patsubst %, test-%, $(TESTS))
apitest: $(patsubst %, test-%, $(APITESTS))
production-test: $(patsubst %, production-test-%, $(TESTS))

test-%:
	$(RINGO_BIN) tests/$*.js

production-test-%:
	$(RINGO_BIN) tests/$*.js -s production

nif-production-url-test:
	$(RINGO_BIN) tests/urltester.js -s production -c vocabulary,ontoquest,federation,monarch

D2T_YAMLS = $(wildcard conf/rdf-mapping/*.yaml)
D2T_JSONS = $(D2T_YAMLS:.yaml=.json)

d2t: $(D2T_JSONS)
	echo YAMLS: $^

triples: conf/monarch-context.jsonld d2t
	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_production.json $(D2T_ARGS) conf/rdf-mapping/*-map.json && ./bin/target-ttl-to-owl.sh

SERVERCONF := production
target/%.ttl: conf/rdf-mapping/%-map.json conf/monarch-context.jsonld
	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_$(SERVERCONF).json $<

target/%.owl: target/%.ttl
	owltools $< --set-ontology-id http://purl.obolibrary.org/obo/upheno/data/$*.owl -o -f ofn target/$*.owl 

# TEMP
#conf/rdf-mapping/%.yaml: conf/rdf-mapping/%.json
#	json2yaml.pl $< > $@.tmp && mv $@.tmp $@

conf/rdf-mapping/%.json: conf/rdf-mapping/%.yaml
	yaml2json.pl $< > $@.tmp && mv $@.tmp $@

conf/monarch-context.jsonld: conf/monarch-context.yaml
	yaml2json.pl $< > $@.tmp && mv $@.tmp $@

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
.PHONY: cli-launch-prod
cli-launch-prod:
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher_production.js --port=$(RINGO_PORT)
.PHONY: cli-launch-dev
cli-launch-dev:
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher_dev.js --port=$(RINGO_PORT)
.PHONY: cli-launch
cli-launch:
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher.js --port=$(RINGO_PORT)
