####
#### Development easing.
####

###
### Environment variables.
###

## NodeJS
NODE_PATH ?= ./node-modules:./modules:./lib/monarch
## TODO/BUG: highly non-canonical location--should be passed as
## variable, not hard-coded.
NODE_BIN ?= $(shell which node)
## Workaround for the above.
NODE_CLI_BIN ?= $(shell which node)
NODE_PORT ?= 8080

## OWLTools.
#OWLTOOLS_MAX_MEMORY ?= 1G
OWLTOOLS_BIN ?= ~/local/src/svn/owltools/OWLTools-Runner/bin/owltools

## Version
MONARCH_VERSION = 0.1.1

###
### Tests
###

APITESTS = apitest class-info-test phenopacket-test
TESTS = $(APITESTS)

test: $(patsubst %, test-%, $(TESTS))
apitest: $(patsubst %, test-%, $(APITESTS))
production-test: $(patsubst %, production-test-%, $(TESTS))

test-%:
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) tests/$*.js

production-test-%:
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) tests/$*.js -s production

nif-production-url-test:
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) tests/urltester.js -s production -c vocabulary,ontoquest,federation,monarch

nif-production-federation-tests:
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) tests/urltester.js -s production -c federation

nif-production-scigraph-tests:
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) tests/urltester.js -s production -c scigraph

nif-production-federation-search-tests:
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) tests/urltester.js -s production -c federation-search

D2T_YAMLS = $(wildcard conf/rdf-mapping/*.yaml)
D2T_JSONS = $(D2T_YAMLS:.yaml=.json)

d2t: $(D2T_JSONS)
	echo YAMLS: $^

triples: conf/monarch-context.jsonld d2t
#	NODE_PATH=$(NODE_PATH) $(NODE_BIN) bin/generate-triples-from-nif.js -c conf/server_config_production.json $(D2T_ARGS) conf/rdf-mapping/*-map.json && ./bin/target-ttl-to-owl.sh
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) bin/generate-triples-from-nif.js -c conf/server_config_dev.json $(D2T_ARGS) conf/rdf-mapping/*-map.json && ./bin/target-ttl-to-owl.sh

#SERVERCONF := production
SERVERCONF := dev
target/%.ttl: conf/rdf-mapping/%-map.json conf/monarch-context.jsonld
	NODE_PATH=$(NODE_PATH) $(NODE_BIN) bin/generate-triples-from-nif.js -c conf/server_config_$(SERVERCONF).json $<

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

.PHONY: golr-conf-as-json
golr-conf-as-json: ./conf/golr-conf.json
./conf/golr-conf.json: ./conf/golr-views
	./scripts/confyaml2json.pl -i $< > $@.tmp && mv $@.tmp $@

reconfigure-golr: solr-schema golr-conf-as-json

###
### Documentation.
###

.PHONY: docs
docs:
	naturaldocs --rebuild-output --input lib/monarch --project lib/.naturaldocs_project/ --output html docs/

###
### Create exportable JS bundle.
###

.PHONY: bundle
bundle:
	./scripts/release-js.pl -u -v -i scripts/release-file-map.txt -o js/monarch.js -n monarch -d js -r $(MONARCH_VERSION)
	rm -f js/monarch.js
	rm -f js/monarch_$(MONARCH_VERSION).js

###
### Deployment.
###

deploy: origin-push heroku-deploy

origin-push:
	git push origin master

dependencies:
	sh ./update_dependencies.sh

## Setup portable Ubuntu environment. -SJC
.PHONY: cli-launch-prod
cli-launch-prod: dependencies
	NODE_PATH=$(NODE_PATH) $(NODE_CLI_BIN) ./lib/monarch/web/webapp_launcher_production.js --port=$(NODE_PORT)
.PHONY: cli-launch-dev
cli-launch-dev: dependencies
	NODE_PATH=$(NODE_PATH) $(NODE_CLI_BIN) ./lib/monarch/web/webapp_launcher_dev.js --port=$(NODE_PORT)
.PHONY: cli-launch
cli-launch: dependencies
	NODE_PATH=$(NODE_PATH) $(NODE_CLI_BIN) ./lib/monarch/web/webapp_launcher.js --port=$(NODE_PORT)
