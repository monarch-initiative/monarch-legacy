
export async function getNodeSummary(nodeId, nodeType) {
  const bioentityUrl = `${biolink}bioentity/${nodeType}/${nodeId}`;
  console.log('getNodeSummary bioentityUrl', nodeId, nodeType, bioentityUrl);

  const params = {
    fetch_objects: true,
    unselect_evidence: false,
    exclude_automatic_assertions: false,
    use_compact_associations: false,
    rows: 100,
  };
  const resp = await axios.get(bioentityUrl, { params });
  const responseData = resp.data;


  const graphUrl = `${biolink}graph/node/${nodeId}`;
  const graphResponse = await axios.get(graphUrl);
  const graphResponseData = graphResponse.data;
  responseData.edges = graphResponseData.edges;
  responseData.nodes = graphResponseData.nodes;

  return responseData;
}
