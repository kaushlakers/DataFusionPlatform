package dataFusionPlatform.server;

import static org.neo4j.helpers.collection.MapUtil.map;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.google.gson.JsonElement;

import dataFusionPlatform.cypher.*;

public class DFService 
{
	private final CypherExecutor cypher;

	public DFService(String uri) 
	{
		cypher = createCypherExecutor(uri);
	}

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
	

    //request handler for initially sending all dataset nodes to front end
	public Map<String, Object> datasets(int limit) {
		
		Iterator<Map<String,Object>> result = cypher.query(
    			"match (n:Dataset) return n as dataset, id(n) as id", 
    			map("1", limit));
		List<Map<String, Object>> datasets = new ArrayList<Map<String, Object>>();
		
		while (result.hasNext())
		{
			Map<String, Object> row = result.next();
			Map<String, Object> dataset = map("id", row.get("id"), "datasetNode", row.get("dataset"));
			datasets.add(dataset);
			
		}
		
		return map("datasets", datasets);
	}
	
	
	
	public Map<String, Object> getDataset(int datasetID, int limit) {
		
		System.out.println(datasetID);
		
		Iterator<Map<String,Object>> result = cypher.query(
    			"start n=node(" + datasetID + ") match (n)<-[:BELONGS_TO*]-(p)<-[:BELONGS_TO]-(c) " +
    			"return n as dataset, labels(n) as datasetType, p.title as parentName, labels(p) as parentType, ID(p) as parentId, p as parent, c.title as childName, labels(c) as childType, ID(c) as childId, c as child", 
    			map("1",limit));
        
    	 List nodes = new ArrayList();
         List rels= new ArrayList();
         
         int i = 0;
         //Iterate through each row of the resulting cypher query
         while (result.hasNext()) 
         {
         	
         	//Row has a dataset, a table, and a collection of columns
         	Map<String, Object> row = result.next();
         	Map<String, Object> datasetNode = map("datasetNode", row.get("dataset"), "type", row.get("datasetType"));
         	
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
         		//dtarget = i++;
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
                rels.add(map("source", ptarget, "target", dsource));
                
               // rels.add(map("source", ptarget, "target", dtarget));
               // ptarget = i++;
                
            }
            
         	//Add the child node if it is not already there
         	Map<String, Object> childNode = map("id", row.get("childId"), "name", row.get("childName"), "type", row.get("childType"), "properties", row.get("child"));
         	int source = nodes.indexOf(childNode);
            if (source == -1) 
            {
                nodes.add(childNode);
                source = i++;
            }
         	 
         	rels.add(map("source", source, "target", ptarget));
         	
         }
         return map("nodes", nodes, "links", rels);
         	
     }
	
	public Map<String, Object> graph(int limit) {
		
		Iterator<Map<String,Object>> result = cypher.query(
    			"match (c)-[:BELONGS_TO]->(p) " +
    			"return c.title as childName, labels(c) as childType, ID(c) as childId, c as child, p.title as parentName, labels(p) as parentType, ID(p) as parentId, p as parent ", 
    			map("1",limit));
        
    	 List nodes = new ArrayList();
         List rels= new ArrayList();
         
         int i = 0;
         //Iterate through each row of the resulting cypher query
         while (result.hasNext()) 
         {
         	
         	//Row has a dataset, a table, and a collection of columns
         	Map<String, Object> row = result.next();
     
         	//Add the child node if it is not already there
         	Map<String, Object> childNode = map("id", row.get("childId"), "name", row.get("childName"), "type", row.get("childType"), "properties", row.get("child"));
         	int source = nodes.indexOf(childNode);
            if (source == -1) 
            {
                nodes.add(childNode);
                source = i++;
            }
         	
         	//Add the parent node if it is not already there
         	Map<String, Object> parentNode = map("id", row.get("parentId"), "name", row.get("parentName"), "type", row.get("parentType"), "properties", row.get("parent"));
         	int target = nodes.indexOf(parentNode);
            if (target == -1) 
            {
                nodes.add(parentNode);
                target = i++;
            }
            
         	rels.add(map("source", source, "target", target));
         	
         }
         return map("nodes", nodes, "links", rels);
		
	}
}

