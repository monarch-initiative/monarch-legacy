human-gene-phenotype-pre.ttl: omim-disease-phenotype.ttl human-gene-disease.ttl
	rdfcat -out N-TRIPLE $^  > $@.tmp && mv $@.tmp $@

human-gene-phenotype.ttl: human-gene-phenotype-pre.ttl
	arq --data $< --query construct-human-gene-phenotype.sparql > $@.tmp && mv $@.tmp $@

owl-human-gene-phenotype.ttl: human-gene-phenotype-pre.ttl
	arq --data $< --query construct-owl-human-gene-phenotype.sparql > $@.tmp && mv $@.tmp $@

%.owl: %.ttl ro.owl
	owltools $< -o $@

ro.owl:
	owltools $(OBO)/ro.owl --merge-imports-closure -o $@
