<template>
  <div>
    <div v-if="!dataFetched">Loading Related Terms ...</div>
    <div v-else>
      <div class="row border-bottom py-2">
        <div class="col-4"><h3>Parent Terms</h3></div>
        <div class="col-4"><h3>Equivalent Terms</h3></div>
        <div class="col-4"><h3>Child Terms</h3></div>
      </div>
      <div class="row py-2">
        <div class="col-4"
             v-for="parent in parents" :key="parent.object.id"
        >
          <div @click="emitSelection(parent.object.label, parent.object.id)"
               class="p-1 m-1 btn btn-info"
          >
            {{parent.object.label}} <br/> ({{parent.object.id}})
          </div>
        </div>
        <div class="col-4"
             v-for="sibling in equivalentTerms" :key="sibling.id"
        >
          <div @click="emitSelection(sibling.lbl, sibling.id)"
               class="p-1 m-1 btn btn-info"
          >
            {{sibling.lbl}} <br/> ({{sibling.id}})
          </div>
        </div>
        <div class="col-4"
             v-for="child in children" :key="child.object.id"
        >
          <div @click="emitSelection(child.subject.label, child.subject.id)"
               class="p-1 m-1 btn btn-info"
          >
            {{child.subject.label}} <br/> ({{child.subject.id}})
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import * as MA from '../../js/MonarchAccess';
import * as _ from 'underscore';

export default {
  data() {
    return {
      equivalentTerms: '',
      rootTerm: '',
      familyData: [],
      children: [],
      siblings: [],
      dataFetched: false,
    };
  },
  props: {
    anchorId: {
      type: String,
      required: true,
    },
  },
  mounted(){
    this.getCurieRelationships();
  },
  methods: {
    async getCurieRelationships() {
      const that = this;
      try {
        let searchResponse = await MA.getNodeSummary(this.anchorId, 'phenotype');
        this.familyData = searchResponse;
        this.sortRelationships();
        this.dataFetched = true;
      }
      catch (e) {
        that.dataError = e;
        console.log('BioLink Error', e);
      }
    },
    emitSelection(termLabel, termId){
      this.$emit('interface',
        {
          curie: termId,
          match: termLabel,
          root: this.rootTerm.id,
        }
      );
    },
    sortRelationships(){
      this.rootTerm = {
        id: this.familyData.id,
        label: this.familyData.label,
        synonyms: this.familyData.synonyms,
      };
      this.equivalentTerms = _.uniq(this.familyData.equivalentNodes, 'id');
      const preChildren = [];
      const preParents = [];
      this.familyData.relationships.forEach((elem) => {
        if (elem.property.id === 'subClassOf') {
          if (elem.object.id === this.anchorId) {
            preChildren.push(elem);
          }
          if (elem.subject.id === this.anchorId) {
            preParents.push(elem);
          }
        }

      });
      this.children = _.uniq(preChildren, 'id');
      this.parents = _.uniq(preParents, 'id');
    },
  },
};
</script>
<style scoped>
  .content {
    width:500px;
    margin:auto;
  }
  .card-header {
    text-align: center;
  }
</style>
