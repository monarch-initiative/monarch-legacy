## DISCO 2 TURTLE

![img](http://fc01.deviantart.net/fs71/f/2012/052/e/7/disco_turtle_by_kiatonasy-d4qk6ab.jpg)

This folder contains YAML configurations for Monarch resources used by
disco2turtle to extract triples from DISCO via Federation services.

Each YAML configuration file describes how to generate a single
particular named graph, in turtle format.

## Running the system

Check out the monarch-app project from github. Currently the
disco2turtle script relies on some Monarch API calls but these may be
separated in future to allow the system to be run independently.

To generate a ttl NG, do this:

    make human-gene-phenotype.ttl

Where the name of the ttl file can be any of the supported NGs.

To make all of them, type

    make triples

You can also convert the ttl to OWL:

    make human-gene-phenotype.owl

This is a useful check - OWL sometimes requires additional
declarations and will often use annotation properties as a default
where object properties should be used. this should be avoided.


## Authoring a configuration

To get started, copy an existing mapping as a template. Always use -map.json.

When done, type "make triples" in top level directory.

 * mapVersion - increase this if you want to re-dump

## Future plans

Eventually disco2turtle will be discarded as we move towards consuming
graph data directly without the need of DISCO, but for now we have a
lot of resources ingested into DISCO and need a way to dump them.

There is considerable overlap in functionality between disco2turtle
and the proposed extensions to the Concept Mapper, particularly making
column to column mappings.

For more background, see:
https://docs.google.com/document/d/1_eEaaoduwuYdiCFMlZtA-PZPRwAcX9isdfq5Oue2F7I/edit#heading=h.ejqhzd8mprcc

## Happy Disco to turtling!

![img](http://www.crestschools.com/wp-content/uploads/2011/08/disco-turtle-sm.jpg)
