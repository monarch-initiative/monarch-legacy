
.PHONY: docs
docs:
	naturaldocs --rebuild-output --input lib/monarch --project lib/.naturaldocs_project/ --output html docs/


app-engine:
	ringo-admin create --google-appengine gae
