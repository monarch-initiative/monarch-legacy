
.PHONY: docs
docs:
	naturaldocs --rebuild-output --input lib/monarch --project lib/.naturaldocs_project/ --output html docs/

heroku-create:
	heroku create --stack cedar --buildpack https://github.com/cmungall/heroku-buildpack-ringojs-jdk7.git --remote monarch
heroku-deploy:
	git push monarch master

app-engine:
	ringo-admin create --google-appengine gae
