package dataFusionPlatform.server;

import static org.neo4j.helpers.collection.MapUtil.map;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

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
	
    @SuppressWarnings("unchecked")
    public Map<String, Object> graph(int limit) {

    	Iterator<Map<String,Object>> result = cypher.query(
                "MATCH (d:Dataset)<-[:BELONGS_TO]-(t:Table)<-[:BELONGS_TO]-(c:Column) " +
                " RETURN d.title as dataset, t.title as table, collect(c.title) as columns", map("1",limit));
        
        
        List nodes = new ArrayList();
        List rels= new ArrayList();
        
        int i = 0;
        //Iterate through each row of the resulting cypher query
        while (result.hasNext()) {
        	
        	//Row has a dataset, a table, and a collection of columns
        	Map<String, Object> row = result.next();
    
        	//Add the Dataset nodes
        	nodes.add(map("title", row.get("dataset"), "label", "dataset"));
        	
        	//Add the Table nodes
        	nodes.add(map("title", row.get("table"), "label", "table"));
        	
        	//Initialize dataset ID and table ID for creating relations
        	int dId = i, tId = i;
        	i++;
        	
        	//Create relation between Dataset and Table
        	rels.add(map("tId", tId, "dId", dId));
        	
        	//Now create nodes for each column in the collection
        	//Name is collection of column objects
        	for (Object name : (Collection) row.get("columns")) {
        		Map<String, Object> column = map("title", name, "label", "column");
        		
        		//Add one column to our list of nodes
        		nodes.add(column);
        		
        		//Initialize column ID for creating relations
        		int cId = i++;
        		
        		//Add relation for a column to its corresponding table
        		rels.add(map("cId", cId, "tId", tId));
        	}
        }
        return map("nodes", nodes, "links", rels);
        	
    }

}
