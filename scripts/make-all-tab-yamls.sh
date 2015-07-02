#!/bin/sh

# Phenotype
./make-tab-yaml.pl Phenotype Disease > ../conf/golr-views/single-tab/phenotype-disease.yaml
./make-tab-yaml.pl Phenotype Model > ../conf/golr-views/single-tab/phenotype-model.yaml
./make-tab-yaml.pl Phenotype Variant > ../conf/golr-views/single-tab/phenotype-variant.yaml
./make-tab-yaml.pl Phenotype Pathway > ../conf/golr-views/single-tab/phenotype-pathway.yaml
./make-tab-yaml.pl Phenotype Gene > ../conf/golr-views/single-tab/phenotype-gene.yaml
./make-tab-yaml.pl Phenotype Genotype > ../conf/golr-views/single-tab/phenotype-genotype.yaml

# Disease
./make-tab-yaml.pl Disease Phenotype > ../conf/golr-views/single-tab/disease-phenotype.yaml
./make-tab-yaml.pl Disease Gene > ../conf/golr-views/single-tab/disease-gene.yaml
./make-tab-yaml.pl Disease Model > ../conf/golr-views/single-tab/disease-model.yaml
./make-tab-yaml.pl Disease Variant > ../conf/golr-views/single-tab/disease-variant.yaml
./make-tab-yaml.pl Disease Pathway > ../conf/golr-views/single-tab/disease-pathway.yaml
./make-tab-yaml.pl Disease Genotype > ../conf/golr-views/single-tab/disease-genotype.yaml

# Variant
./make-tab-yaml.pl Variant Phenotype > ../conf/golr-views/single-tab/variant-phenotype.yaml
./make-tab-yaml.pl Variant Disease > ../conf/golr-views/single-tab/variant-disease.yaml
./make-tab-yaml.pl Variant Model > ../conf/golr-views/single-tab/variant-model.yaml
./make-tab-yaml.pl Variant Genotype > ../conf/golr-views/single-tab/variant-genotype.yaml
./make-tab-yaml.pl Variant Pathway > ../conf/golr-views/single-tab/variant-pathway.yaml
./make-tab-yaml.pl Variant Gene > ../conf/golr-views/single-tab/variant-gene.yaml

# Model
./make-tab-yaml.pl Model Phenotype > ../conf/golr-views/single-tab/model-phenotype.yaml
./make-tab-yaml.pl Model Disease > ../conf/golr-views/single-tab/model-disease.yaml
./make-tab-yaml.pl Model Gene > ../conf/golr-views/single-tab/model-gene.yaml
./make-tab-yaml.pl Model Variant > ../conf/golr-views/single-tab/model-variant.yaml
./make-tab-yaml.pl Model Pathway > ../conf/golr-views/single-tab/model-pathway.yaml

# Gene
./make-tab-yaml.pl Gene Phenotype > ../conf/golr-views/single-tab/gene-phenotype.yaml
./make-tab-yaml.pl Gene Disease > ../conf/golr-views/single-tab/gene-disease.yaml
./make-tab-yaml.pl Gene Model > ../conf/golr-views/single-tab/gene-model.yaml
./make-tab-yaml.pl Gene Variant > ../conf/golr-views/single-tab/gene-variant.yaml
./make-tab-yaml.pl Gene Pathway > ../conf/golr-views/single-tab/gene-pathway.yaml
./make-tab-yaml.pl Gene Homolog > ../conf/golr-views/single-tab/gene-homolog.yaml
./make-tab-yaml.pl Gene Genotype > ../conf/golr-views/single-tab/gene-genotype.yaml

#Genotype
./make-tab-yaml.pl Genotype Variant > ../conf/golr-views/single-tab/genotype-variant.yaml
./make-tab-yaml.pl Genotype Gene > ../conf/golr-views/single-tab/genotype-gene.yaml
./make-tab-yaml.pl Genotype Phenotype > ../conf/golr-views/single-tab/genotype-phenotype.yaml
./make-tab-yaml.pl Genotype Disease > ../conf/golr-views/single-tab/genotype-disease.yaml
