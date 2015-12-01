package dataFusionPlatform.server;

import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import dataFusionPlatform.entity.DFResponse;
import dataFusionPlatform.utility.Util;

public class TestMain {
	Node firstNode;
	Node secondNode;
	Relationship relationship;
	
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		Gson gson = new GsonBuilder().disableHtmlEscaping().create();
		int datasetId1 = 26;
		int datasetId2 = 35;
		DFService service = new DFService(Util.getNeo4jUrl());
		
		DFResponse response = service.getDatasetMatches(16, 26, "represents", 
				true, 100);
		//DFResponse response = service.matchPropertyNew("represents", 
			//	"some:CytogeneticLocation", 26, 1000);
		
		
		
		System.out.println(gson.toJson(response));
	}

}
