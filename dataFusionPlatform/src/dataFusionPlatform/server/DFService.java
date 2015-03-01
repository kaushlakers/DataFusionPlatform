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
    /*    Iterator<Map<String,Object>> result = cypher.query(
                "MATCH (m:Movie)<-[:ACTED_IN]-(a:Person) " +
                " RETURN m.title as movie, collect(a.name) as cast " +
                " LIMIT {1}", map("1",limit));   */
    	Iterator<Map<String,Object>> result = cypher.query(
                "MATCH (t:Table)<-[:BELONGS_TO]-(c:Column) " +
                " RETURN t.title as table, collect(c.title) as columns", map("1",limit));
        
        
        List nodes = new ArrayList();
        List rels= new ArrayList();
        int i=0;
        while (result.hasNext()) {
            Map<String, Object> row = result.next();
            nodes.add(map("title",row.get("table"),"label","table"));
            int target=i;
            i++;
            for (Object name : (Collection) row.get("columns")) {
                Map<String, Object> column = map("title", name,"label","column");
                /*
                int source = nodes.indexOf(column);
                if (source == -1) {
                    nodes.add(column);
                    source = i++;
                }
                */
                nodes.add(column);
                int source = i++;
                rels.add(map("source",source,"target",target));
            }
        }
        return map("nodes", nodes, "links", rels);
    }

}
