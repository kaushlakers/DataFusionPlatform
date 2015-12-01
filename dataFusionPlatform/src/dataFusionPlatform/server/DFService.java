package dataFusionPlatform.server;
import static org.neo4j.helpers.collection.MapUtil.map;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Random;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import dataFusionPlatform.cypher.CypherExecutor;
import dataFusionPlatform.cypher.JdbcCypherExecutor;
import dataFusionPlatform.entity.DFDataset;
import dataFusionPlatform.entity.DFNode;
import dataFusionPlatform.entity.DFRelation;
import dataFusionPlatform.entity.DFResponse;
import dataFusionPlatform.utility.Constants;

/*
 * DFService is responsible for using the Cypher Executor to query the Neo4j server.
 * Various methods are set up that run different queries and return JSON parsable data.
 */
public class DFService 
{
	private final CypherExecutor cypher;
	private Random rand;
	// Constructor
	public DFService(String uri) 
	{
		cypher = createCypherExecutor(uri);
		rand =  new Random();
	}
	// creates and instance of the Cypher Executor with the given URL
	private CypherExecutor createCypherExecutor(String uri) 
	{
		try 
		{
			String auth = new URL(uri).getUserInfo();
	        if (auth != null) 
	        {
	        	String[] parts = auth.split(":");
	        	return new JdbcCypherExecutor(uri,parts[0],parts[1]);
	        }
	        return new JdbcCypherExecutor(uri);
		} catch (MalformedURLException e) 
		{
			throw new IllegalArgumentException("Invalid Neo4j-ServerURL " + uri);
	    }
	}
	

    // request handler for initially sending all dataset nodes to front end
	// limit defines the max length of the response. It is used as a parameter in requests
	public Map<String, Object> datasets(int limit) {
		// limit tells the neo4j server the max length of the response
		Iterator<Map<String,Object>> result = cypher.query(
    			"match (n:Dataset) return n as dataset, id(n) as id", 
    			map("1", limit));
		List<Map<String, Object>> datasets = new ArrayList<Map<String, Object>>();
		
		//result is essentially a collection of rows in a table of data returned by the query
		while (result.hasNext())
		{
			Map<String, Object> row = result.next();
			Map<String, Object> dataset = map("id", row.get("id"), "datasetNode", row.get("dataset"));
			datasets.add(dataset);
			
		}
		
		return map("datasets", datasets);
	}
	
	public Iterator<Map<String,Object>> getDatasetNodes(int datasetName, int limit) {
		Iterator<Map<String,Object>> result = cypher.query("match (n)<-[:BELONGS_TO]-(p)<-[:BELONGS_TO]-(c) where n.type=dataset "
				+ "AND n.title="+datasetName+" "
				+"return n", new HashMap());
		return result;
	}
	
	// request handler for obtaining the column and table nodes/edges of a dataset with the given ID
		public Map<String, Object> getDataset(int datasetID, int limit) {
			
			// limit tells the neo4j server the max length of the response
			Iterator<Map<String,Object>> result = cypher.query(
	    			"start n=node(" + datasetID + ") match (n)<-[:BELONGS_TO]-(p)<-[:BELONGS_TO]-(c) "
	    			+ "return n as dataset, labels(n)[0] as datasetType, ID(n) as datasetId, n.title as datasetName, p.title as parentName, labels(p)[0] as parentType, ID(p) as parentId, p as parent, c.title as childName, labels(c)[0] as childType, ID(c) as childId, c as child",
	    			map("1",limit));
			
			
	        
	    	 List nodes = new ArrayList();
	         List rels= new ArrayList();
	         
	         int i = 0;
	         //Iterate through each row of the resulting cypher query
	         while (result.hasNext()) 
	         {
	         	
	         	//Row has a dataset, a table, and a collection of columns
	         	Map<String, Object> row = result.next();
	         	Map<String, Object> datasetNode = map("id", row.get("datasetId"), "name", row.get("datasetName"), "type", row.get("datasetType"), "properties", row.get("dataset"));
	         	
	         	//Dont need dtarget (Justin 4/5/15)
	         	//int dtarget = i;
	         	
	         	//Check index for a dataset node, if it does not exist, add it to the 
	         	//list of nodes
	         	int dsource = nodes.indexOf(datasetNode);
	         	if (dsource == -1)
	         	{
	         		nodes.add(datasetNode);
	         		
	         		//Increment and use dsource to create edges from a dataset 
	         		//node to a Column or JoinColumn node (Justin 4/5/15)
	         		dsource = i++;
	         	}
	         	
	        	//Add the parent node if it is not already there
	         	Map<String, Object> parentNode = map("id", row.get("parentId"), "name", row.get("parentName"), "type", row.get("parentType"), "properties", row.get("parent"));
	         	int ptarget = nodes.indexOf(parentNode);
	            if (ptarget == -1) 
	            {
	                nodes.add(parentNode);
	                
	                //Needed the increment of the parent index before adding 
	                //the relation to a dataset node. Also use the counter dsource 
	                //not dtarget (Justin 4/5/15)
	                ptarget = i++;
	                rels.add(map("source", ptarget, "target", dsource, "id","line"));

	                
	            }
	            
	         	//Add the child node if it is not already there
	         	Map<String, Object> childNode = map("id", row.get("childId"), "name", row.get("childName"), "type", row.get("childType"), "properties", row.get("child"));
	         	int source = nodes.indexOf(childNode);
	            if (source == -1) 
	            {
	                nodes.add(childNode);
	                source = i++;
	            }
	            // source and target are indices of their respective nodes in the nodes list
	         	rels.add(map("source", source, "target", ptarget, "id","line"));
	         	
	         }
	         return map("nodes", nodes, "links", rels);
	         	
	     }

	public DFDataset getDatasetNew(int datasetId, List<Integer> tableIds, int limit) {
		
		// limit tells the neo4j server the max length of the response
		
		String whereClause = "where ID(dataset)= "+datasetId;
		if (tableIds != null) {
			whereClause = whereClause + " AND ";
			System.out.println(tableIds.size());
			for (int i = 0; i < tableIds.size(); i++) {
				
				int tableId = tableIds.get(i);
				whereClause = whereClause + "ID(table)=" + tableId + " ";
				if (i < tableIds.size() - 1) {
					whereClause = whereClause + "OR ";
				}
	
			}
		}	
		String query = "start n=node(" + datasetId + ") "
				+ "match (dataset)<-[tableDatasetRel:BELONGS_TO]-(table)<-[columnTableRel:BELONGS_TO]-(column) "
				+ whereClause + " "
    			+ "return dataset, ID(dataset) as datasetId, "
    			+ "table, ID(table) as tableId, "
    			+ "column, ID(column) as columnId, "
    			+"tableDatasetRel, ID(tableDatasetRel) as tableDatasetRelId, "
    			+ "columnTableRel, ID(columnTableRel) as columnTableRelId";
		
        DFDataset dataset = new DFDataset();
        
        Iterator<Map<String, Object>> result = cypher.query(query, map("1", limit));
        
        while (result.hasNext()) {
	     	
	     	Map<String, Object> row = result.next();
	     	
	     	if (dataset.getDatasetNode() == null) {
	     		DFNode datasetNode = new DFNode(row.get("datasetId"), Constants.datasetType, row.get("dataset")); 
		     	dataset.setDatasetNode(datasetNode);
	     	}
	     		     	
	     	DFNode tableNode = new DFNode(row.get("tableId"), Constants.tableType, row.get("table"));
	     	List<DFNode> tableNodes = dataset.getTableNodes();
	        if (tableNodes.indexOf(tableNode) == -1) {
	            tableNodes.add(tableNode);
	            dataset.setTableNodes(tableNodes);
	            DFRelation tableDatasetRel = new DFRelation((int) row.get("tableDatasetRelId"),
	            		(Map<String, Object>)row.get("tableDatasetRel"), false);
	            dataset.getRelationships().add(tableDatasetRel);	            
	        }
	        
	     	DFNode columnNode = new DFNode(row.get("columnId"), Constants.columnType, row.get("column"));
	     	List<DFNode> columnNodes = dataset.getColumnNodes();
	        if (columnNodes.indexOf(columnNode) == -1) {
	            columnNodes.add(columnNode);
	            dataset.setColumnNodes(columnNodes);
	            
	            DFRelation columnTableRel = new DFRelation((int) row.get("columnTableRelId"), 
	            		(Map<String, Object>)row.get("columnTableRel"), false);
	            dataset.getRelationships().add(columnTableRel);
	        }
	     }
		 return dataset;
	     	
	 }
	
	public DFResponse getDatasetMatches(int datasetId1, int datasetId2, 
			String field, boolean intermediate, int limit) {
		
		DFDataset dataset1 = this.getDatasetNew(datasetId1, null,100);
		DFDataset dataset2 = this.getDatasetNew(datasetId2, null,100);
		
		DFResponse response =  new DFResponse();
		
		if (intermediate) {
			response = this.getIntermediateDatasetMatches(datasetId1, datasetId2, field, limit);
		}
		
		List<DFRelation> crossDatasetLinks = this.matchAndLinkColumnsBetweenDatasets(
				dataset1.getColumnNodes(), dataset2.getColumnNodes(), field);
		
		HashMap<String, Object> responseMap = new HashMap();
		ArrayList<DFDataset> datasets = new ArrayList();
		datasets.add(dataset1);
		datasets.add(dataset2);
		
		response.getDatasets().addAll(datasets);
		response.getCrossDatasetLinks().addAll(crossDatasetLinks);
		
		//responseMap.put("datasets", datasets);
		//responseMap.put("crossLinks", crossDatasetLinks);
		
		return response;
	}

	public DFResponse getIntermediateDatasetMatches(int datasetId1, int datasetId2, String field, int limit) {
		
		
		String query = "match (c:Column)-[:BELONGS_TO]->(t)-[:BELONGS_TO]->(d:Dataset) where ID(d)="
				+ datasetId1 + " " 
				+ "with c as col1 " 
				+ "match (c:Column)-[:BELONGS_TO]->(t)-[:BELONGS_TO]->(d:Dataset) "
				+ "where c.represents = col1.represents and not ID(d) =" + datasetId1 +" and not ID(d) =" + datasetId2
				+ " with col1, c, t, d "
				+ "match (col2:Column)-[:BELONGS_TO]->(t)-[:BELONGS_TO]->(d:Dataset) "
				+ "with col1,c as col1Match,col2, t as tbl2, d as dset2 "
				+ "match (col3:Column)-[:BELONGS_TO]->(tbl3)-[:BELONGS_TO]->(dset3:Dataset) where ID(dset3)=" + datasetId2
				+ " and col3.represents = col2.represents "
				+ "return  col3 as dset2Match, ID(col3) as dset2MatchId"
				+ ",col2 as dset2IntermMatch, ID(col2) as dset2IntermMatchId"
				+ ", col1 as dset1Match, ID(col1) as dset1MatchId"
				+ ",col1Match as dset1IntermMatch, ID(col1Match) as dset1IntermMatchId"
				+ ",tbl2 as intermTable, ID(tbl2) as intermTableId"
				+ ",dset2 as intermDataset, ID(dset2) as intermDatasetId";
				
		
		Iterator<Map<String, Object>> result = cypher.query(query, map("1", limit));
		
		HashMap<Integer, HashSet<Integer>> intermDatasetMap = new HashMap<Integer, HashSet<Integer>>();
		
		List<DFRelation> crossLinks = new ArrayList<DFRelation>();
		
		while (result.hasNext()) {
			Map<String, Object> row = result.next();
			
			int datasetId = (int) row.get("intermDatasetId");
			if (! intermDatasetMap.containsKey(datasetId)) {
				intermDatasetMap.put(datasetId, new HashSet<Integer>());
			}
			
			int tableId = (int) row.get("intermTableId");
			intermDatasetMap.get(datasetId).add(tableId);
			
			crossLinks.add(createCrossLink((int) row.get("dset1MatchId"), (int) row.get("dset1IntermMatchId")));
			
			crossLinks.add(createCrossLink((int) row.get("dset2MatchId"), (int) row.get("dset2IntermMatchId")));	
		}
		List<DFDataset> datasets = new ArrayList<DFDataset>();
		
		for (Map.Entry<Integer, HashSet<Integer>> entry : intermDatasetMap.entrySet()) {
			System.out.println(entry.getValue());
			List<Integer> tableIds = new ArrayList<Integer>(entry.getValue());
			datasets.add(this.getDatasetNew(entry.getKey(), tableIds, 100));
		}
		
		return new DFResponse(datasets, crossLinks);
	}
	
		
	public List<DFRelation> matchAndLinkColumnsBetweenDatasets(List<DFNode> datasetOneColumns, List<DFNode> datasetTwoColumns, String field) {
		
		List<DFRelation> crossDatasetRelations = new ArrayList<DFRelation>();
		
		Map<String, ArrayList<Integer>> datasetOneFieldBasedMap = buildMapHashedByField(datasetOneColumns, field);
		Map<String, ArrayList<Integer>> datasetTwoFieldBasedMap = buildMapHashedByField(datasetTwoColumns, field);
		
		for (Map.Entry<String, ArrayList<Integer>> entry : datasetOneFieldBasedMap.entrySet()) {
			if (datasetTwoFieldBasedMap.containsKey(entry.getKey())) {
				
				//extending the cross dataset relation list
				crossDatasetRelations.addAll(createCrossDatasetRelationsForSingleKey(
						entry.getValue(), datasetTwoFieldBasedMap.get(entry.getKey())));
			}
		}
				
		return crossDatasetRelations;
	}
	
	private DFRelation createCrossLink(int columnId1, int columnId2) {
		return new DFRelation(rand.nextInt(10000), columnId1, columnId2, true);
	}
	
	private List<DFRelation> createCrossDatasetRelationsForSingleKey(List<Integer> datasetOneNodeIds, 
			List<Integer> datasetTwoNodeIds) {
		
		
		List<DFRelation> relations = new ArrayList<DFRelation>();
		for (int datasetOneNodeId: datasetOneNodeIds) {
			 
			for (int datasetTwoNodeId: datasetTwoNodeIds) {
				DFRelation crossRelation = createCrossLink(datasetOneNodeId, datasetTwoNodeId);
				relations.add(crossRelation);
			}
		}
		
		return relations;
		
	}
	
	/**
	 * Method to build a map, that has key as the field values, 
	 * and the value as the list of node ids
	 * that have the same field value
	 * 
	 * @param datasetColumns list of column nodes in a dataset
	 * @param field the field to be hashed on
	 * @return map of field value as key, and node ids as value
	 */
	private Map<String, ArrayList<Integer>> buildMapHashedByField(List<DFNode> datasetColumns, String field) {
		
		Map<String, ArrayList<Integer>> fieldBasedNodeIdMap = new HashMap<String, ArrayList<Integer>>();
		for (DFNode columnNode: datasetColumns) {
			Map<String, Object> propertyMap = columnNode.getProperties();
			if (propertyMap.containsKey(field)) {
				String fieldValue = propertyMap.get(field).toString();
				
				if (!fieldBasedNodeIdMap.containsKey(fieldValue)) {
					fieldBasedNodeIdMap.put(fieldValue, new ArrayList<Integer>());
				}
				fieldBasedNodeIdMap.get(fieldValue).add(columnNode.getId());
			}
		}
	
		return fieldBasedNodeIdMap;		
	
	}
	
	// request handler for obtaining nodes that have a certain property value 
	// the property parameter is used in the query to find nodes that have a 
	// specific value specified by propertyValue
	public Map<String, Object> matchProperty(String property, String propertyValue, int limit)
	{
		List<Map<String, Object>> resultingNodes = new ArrayList<Map<String, Object>>();
		try {
		// limit tells the neo4j server the max length of the response
			Iterator<Map<String,Object>> result = cypher.query(
					"match (n:Column) where n." + property + " = \"" + propertyValue + "\" return n.title as name, labels(n)[0] as type, id(n) as id, n as node", 
					map("1", limit));
			
			
			
			//result is essentially a collection of rows in a table of data returned by the query
			while (result.hasNext())
			{
				Map<String, Object> row = result.next();
				Map<String, Object> node = map("id", row.get("id"), "name", row.get("name"), "type", row.get("type"), "properties", row.get("node"));
	         	
				resultingNodes.add(node);
				
			}
		}
		catch(Exception e) {
			e.printStackTrace();
		}
		return map("resultingNodes", resultingNodes);
	}
	
	//TODO: Need to increase code reuse with GetDataset.
	public DFResponse matchPropertyNew(String property, String propertyValue, int datasetId, int limit) {
		Gson gson = new GsonBuilder().disableHtmlEscaping().create();
		String query = "match (c:Column)-[:BELONGS_TO]->(t)-[:BELONGS_TO]->(d)"
				+ " where c." + property +" = '" +propertyValue + "'"  
				+ " with t "
				+ "match (column:Column)-[tableColumnRel:BELONGS_TO]->(t)-[datasetTableRel:BELONGS_TO]->(dataset) "
				+ "return column, t as table, dataset, " +
				"tableColumnRel, datasetTableRel, " +
				"ID(tableColumnRel) as tableColumnRelId," +
				"ID(datasetTableRel) as datasetTableRelId," +
				"ID(column) as columnId, ID(t) as tableId, ID(dataset) as datasetId";
		
		Iterator<Map<String, Object>> result = cypher.query(query, map("1", limit));
		
		HashMap<Integer, DFDataset> datasetMap = new HashMap<Integer, DFDataset>();
		
		//list of column ids in current dataset with same prop value
		List<Integer> srcColumns = new ArrayList<Integer>();
		
		//list of column ids in other datasets with same prop value.
		List<Integer> matchedColumns = new ArrayList<Integer>();
		//use 2 lists to create cross links between them. Something like bipartite matching
		
		while(result.hasNext()) {
			Map<String, Object> row = result.next();
			
			int currentDatasetId = (int) row.get("datasetId");
			
			//only want full nodes of different datasets
			if(currentDatasetId != datasetId) {
			
				if(!datasetMap.containsKey(currentDatasetId)) {
					DFDataset dataset = new DFDataset();
					dataset.setDatasetNode(new DFNode(row.get("datasetId"), Constants.datasetType, row.get("dataset")));
					datasetMap.put(currentDatasetId, dataset);
				}
				
				DFDataset dataset = datasetMap.get(currentDatasetId);
				DFNode tableNode = new DFNode(row.get("tableId"), Constants.tableType, row.get("table"));
		     	List<DFNode> tableNodes = dataset.getTableNodes();
		        if (tableNodes.indexOf(tableNode) == -1) {
		            tableNodes.add(tableNode);
		            dataset.setTableNodes(tableNodes);
		            DFRelation tableDatasetRel = new DFRelation((int) row.get("datasetTableRelId"), (Map<String, Object>)row.get("datasetTableRel"), false);
		            dataset.getRelationships().add(tableDatasetRel);	            
		        }
		        
		     	DFNode columnNode = new DFNode(row.get("columnId"), Constants.columnType, row.get("column"));
		     	List<DFNode> columnNodes = dataset.getColumnNodes();
		     	columnNodes.add(columnNode);
		     	dataset.setColumnNodes(columnNodes);
		     	DFRelation columnTableRel = new DFRelation((int) row.get("tableColumnRelId"), (Map<String, Object>)row.get("tableColumnRel"), false);
		     	dataset.getRelationships().add(columnTableRel);
		     	if (columnNode.getProperties().containsKey(property) && 
		     			columnNode.getProperties().get(property).equals(propertyValue)) {
		     		matchedColumns.add((int) row.get("columnId"));
		     	}	
			}
			else { //add node ids of current dataset columns that match prop value
				//we don't need full nodes. Already have it in UI at this point
				DFNode columnNode = new DFNode(row.get("columnId"), Constants.columnType, row.get("column"));
				if (columnNode.getProperties().containsKey(property) &&
						columnNode.getProperties().get(property).equals(propertyValue)) {
					int columnId = (int)row.get("columnId");
					srcColumns.add(columnId);
				}
			}
		}
		List<DFRelation> crossLinks = createCrossDatasetRelationsForSingleKey(
				srcColumns, matchedColumns);
		ArrayList<DFDataset> datasets = new ArrayList<DFDataset>(datasetMap.values());
		
		DFResponse response = new DFResponse(datasets, crossLinks);
		
		//response contains list of datasets that have matched column nodes and 
		//crosslinks between nodes of current dataset and matched nodes of other datasets
		//NOTE: datasets are only partial i.e matched node, its siblings, its table and its dataset node.
		//TODO: Distinguish between partial and full dataset in response
		
		return response;
	}
	
	
	
	// this method will run a cypher query that, given a column node id, will return the dataset, table and sibling columns of the given node
	public Map<String, Object> getTable(int nodeId, int limit)
	{	
		Iterator<Map<String,Object>> result = cypher.query(
				"start n=node(" + nodeId + ") " +
				"match (n)-->(p) " +
				"with id(p) as pid " +
				"match path=(n)-->(t)-->(d) " +
				"where id(t) = pid " +
				"unwind nodes(path) as r " +
				"return distinct r.title as name, labels(r)[0] as type, id(r) as id, r as node",
				map("1", limit));

		List<Map<String, Object>> nodes = new ArrayList<Map<String, Object>>();
		List<Map<String, Object>> links = new ArrayList<Map<String, Object>>();
		// list of indices in the node array that are column nodes 
		List<Integer> columnIndices = new ArrayList<>();
		int datasetIndex = 0, tableIndex = 0;
		int i = 0;
		
		while (result.hasNext())
		{
			Map<String, Object> row = result.next();
			Map<String, Object> node = map("id", row.get("id"), "name", row.get("name"), "type", row.get("type"), "properties", row.get("node"));
	     	String nodeType = (String) row.get("type");
	     	
			if (nodeType.equalsIgnoreCase("dataset")) { datasetIndex = i; }
			else if (nodeType.equalsIgnoreCase("table") || nodeType.equalsIgnoreCase("jointable")) { tableIndex = i; }
			else { columnIndices.add(i); }
			nodes.add(node);
			i++;
		}
		
		links.add(map("source", tableIndex, "target", datasetIndex, "id","line"));
		
		for (int cIndex : columnIndices)
		{
			links.add(map("source", cIndex, "target", tableIndex, "id","line"));
		}	
		
		return map("nodes", nodes, "links", links);	
	}
	
	
	// this method will run a cypher query that will return the parent table node's ID for any given column node
	public Map<String, Object> getTableIdForNode(int nId, int limit) {
		
		Iterator<Map<String,Object>> result = cypher.query(
				"start n=node(" + nId + ") " +
				"match (n)-->(p) " +
				"return id(p) as tableID",
				map("1", limit));
	
		Map<String, Object> row = null;
		
		while (result.hasNext())
		{
			row = result.next();
		}
		
		return map("idForTable", row.get("tableID"));
	}
		
	
}

