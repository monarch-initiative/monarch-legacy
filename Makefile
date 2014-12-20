####
#### Development easing.
####

###
### Environment variables.
###

## Ringo
RINGO_MODULE_PATH ?= ../stick/lib:./modules/
## TODO/BUG: highly non-canonical location--should be passed as
## variable, not hard-coded.
RINGO_BIN ?= ./ringojs/bin/ringo
## Workaround for the above.
RINGO_CLI_BIN ?= /usr/bin/ringo
RINGO_PORT ?= 8080

## OWLTools.
#OWLTOOLS_MAX_MEMORY ?= 1G
OWLTOOLS_BIN ?= ~/local/src/svn/owltools/OWLTools-Runner/bin/owltools

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

nif-production-federation-tests:
	$(RINGO_BIN) tests/urltester.js -s production -c federation

nif-production-federation-search-tests:
	$(RINGO_BIN) tests/urltester.js -s production -c federation-search

D2T_YAMLS = $(wildcard conf/rdf-mapping/*.yaml)
D2T_JSONS = $(D2T_YAMLS:.yaml=.json)

d2t: $(D2T_JSONS)
	echo YAMLS: $^

triples: conf/monarch-context.jsonld d2t
#	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_production.json $(D2T_ARGS) conf/rdf-mapping/*-map.json && ./bin/target-ttl-to-owl.sh
	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_dev.json $(D2T_ARGS) conf/rdf-mapping/*-map.json && ./bin/target-ttl-to-owl.sh

#SERVERCONF := production
SERVERCONF := dev
target/%.ttl: conf/rdf-mapping/%-map.json conf/monarch-context.jsonld
	$(RINGO_BIN) bin/generate-triples-from-nif.js -c conf/server_config_$(SERVERCONF).json $<

target/%.owl: target/%.ttl
	owltools $< --set-ontology-id http://purl.obolibrary.org/obo/upheno/data/$*.owl -o -f ofn target/$*.owl 

# TEMP
#conf/rdf-mapping/%.yaml: conf/rdf-mapping/%.json
#	json2yaml.pl $< > $@.tmp && mv $@.tmp $@

YAML2JSON = yaml2json.pl
##YAML2JSON = python yaml2json.py

conf/rdf-mapping/%.json: conf/rdf-mapping/%.yaml
	yaml2json.pl $< > $@.tmp && mv $@.tmp $@

conf/monarch-context.jsonld: conf/monarch-context.yaml
	yaml2json.pl $< > $@.tmp && mv $@.tmp $@

###
### Compile the Solr schema and JSON config out of the YAML files.
###

solr-schema: ./conf/golr-views/*-config.yaml
	$(OWLTOOLS_BIN) --solr-config $? --solr-schema-dump | ./scripts/remove-schema-cruft.pl > ./conf/schema.xml

.PHONY: schema-as-json
golr-conf-as-json:
	./scripts/confyaml2json.pl -i ./conf/golr-views > ./conf/golr-conf.json

reconfigure-golr: solr-schema golr-conf-as-json

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

dependencies:
	sh ./update_dependencies.sh

## Setup portable Ubuntu environment. -SJC
.PHONY: cli-launch-prod
cli-launch-prod: dependencies
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher_production.js --port=$(RINGO_PORT)
.PHONY: cli-launch-dev
cli-launch-dev: dependencies
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher_dev.js --port=$(RINGO_PORT)
.PHONY: cli-launch
cli-launch: dependencies
	RINGO_MODULE_PATH=$(RINGO_MODULE_PATH) $(RINGO_CLI_BIN) ./lib/monarch/web/webapp_launcher.js --port=$(RINGO_PORT)
