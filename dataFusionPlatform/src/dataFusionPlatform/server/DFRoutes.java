 package dataFusionPlatform.server;

import static spark.Spark.get;
import static spark.Spark.post;

import java.util.ArrayList;
import java.util.HashMap;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import dataFusionPlatform.entity.DFDataset;
import dataFusionPlatform.entity.DFResponse;
import dataFusionPlatform.utility.Util;
import spark.Request;
import spark.Response;
import spark.Route;
import spark.servlet.SparkApplication;



/*
 * DFRoutes defines our application's endpoints - where the web browser interacts with our backend.
 * The init() method is the first method to run in our application's back end.  It sets up the URLs
 * that the browser can request via HTTP and sends the resulting data as a response.  Inside the init
 * method, we can define handlers for the various types of HTTP requests such as GET, POST, etc.
 * The actions to be taken within the handlers are delegated to the DFService class.  DFService has 
 * various methods that correlate to these routes.
 */
public class DFRoutes implements SparkApplication{

	private Gson gson = new GsonBuilder().disableHtmlEscaping().create();
    private DFService service = new DFService(Util.getNeo4jUrl());

	@Override
	public void init() 
	{

		
		// handles a get request to the route /datasets
		// it is initially requested when the webpage loads in order to give the user a list of datasets to start from
		get("/datasets", new Route() {
            public Object handle(Request request, Response response) {
            	// limit defines a limit on the length of the response if it is not defined in the request
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
                // The gson.toJson simply converts the given data to JSON format for sending it in an HTTP response.
            	// Here we are calling the datasets method in the service object which will query neo4j for all the 
            	// datasets in the database.
            	return gson.toJson(service.datasets(limit));
               
            }
        }); 
		
		// handles a request to the route /getDataset/536 for example
		// :datasetID is a parameter for any value that follows the second slash
		// It is expected to be an integer value that is the ID number of a user-chosen dataset
		get("/getDataset/:datasetID", new Route() {
            public Object handle(Request request, Response response) {
            	// limit defines a limit on the length of the response if it is not defined in the request
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
            	// we must convert the datasetID to a integer since it comes in as a string
                int dID = Integer.parseInt(request.params(":datasetID"));
                
                
                // The gson.toJson simply converts the given data to JSON format for sending it in an HTTP response.
            	// Here we are calling the getDataset method in the service object which will query neo4j for the 
            	// table and column nodes and edges of a dataset with the given ID.
            	DFDataset dataset = service.getDatasetNew(dID, null, limit);
                HashMap<String, Object> responseMap = new HashMap();
                
                ArrayList<DFDataset> datasets =  new ArrayList<DFDataset>();
                datasets.add(dataset);
                DFResponse resp = new DFResponse();
                resp.setDatasets(datasets);
                
                return gson.toJson(resp);
               
            }
        });
		/*
		get("/getDatasetMatches/:datasetID1/:datasetID2", new Route() {
			public Object handle(Request request, Response response) {
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
                int datasetId1 = Integer.parseInt(request.params(":datasetID1"));
                int datasetId2 = Integer.parseInt(request.params(":datasetID2"));
                //int intermediate = Boolean.parseBoolean(request.params(param))
                
                DFResponse resp = service.getDatasetMatches(datasetId1, datasetId2, "represents", false,limit);
        		
                return gson.toJson(resp);
        		

			}
		});
		*/
		post("/getDatasetMatches", new Route() {
			public Object handle(Request request, Response response){
				
				try {
				
					JsonParser parser = new JsonParser();
					JsonObject requestData = (JsonObject) parser.parse(request.body());
					//System.out.println(requestData.getAsString());
					int datasetId1 = Integer.parseInt(requestData.get("datasetId1").getAsString());
					int datasetId2 = Integer.parseInt(requestData.get("datasetId2").getAsString());
					
					boolean intermediate = Boolean.parseBoolean(requestData.get("intermediate").getAsString());
					
					int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
					
					DFResponse dfResponse = service.getDatasetMatches(datasetId1, datasetId2, "represents",
							intermediate, limit); 
					
					return gson.toJson(dfResponse);
			
				} catch(Exception e) {
					e.printStackTrace();
				}
				return null;
			}	
		});
		
		
		
		// handles a request to the route: /getTableIdForNode/547 for example
		// it will return the table node ID for any given column node ID
		get("/getTableIdForNode/:nodeID", new Route() {
            public Object handle(Request request, Response response) {
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
                int nID = Integer.parseInt(request.params(":nodeID"));
            	return gson.toJson(service.getTableIdForNode(nID, limit));
               
            }
        });
		
		// handles a request to the route /matchProperty/represents/mesh:Disease for example
		// :property is the node/column property that the user wants to use to find other nodes 
		// having a certain :propertyValue
		/*
		get("/matchProperty/:property/:propertyValue", new Route() {
            public Object handle(Request request, Response response) {
            	// limit defines a limit on the length of the response if it is not defined in the request
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
                String prop = request.params(":property");
                String propVal = request.params(":propertyValue");
                // The gson.toJson simply converts the given data to JSON format for sending it in an HTTP response.
            	// Here we are calling the matchProperty method in the service object which will query neo4j for all the 
            	// nodes that have a :property with a certain :propertyValue
                return gson.toJson(service.matchProperty(prop, propVal, limit));
               
            }
        });*/
		
		post("/matchProperty", new Route() {
			public Object handle(Request request, Response response){
				
				
				JsonParser parser = new JsonParser();
				JsonObject requestData = (JsonObject) parser.parse(request.body());
				String propName = requestData.get("propName").getAsString();
				System.out.println(requestData.get("datasetId"));
				String propValue = requestData.get("propValue").getAsString();
				
				int datasetId = Integer.parseInt(requestData.get("datasetId").getAsString());
				
				int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
				
				DFResponse dfResponse = service.matchPropertyNew(propName, propValue, datasetId, limit); 
				
				return gson.toJson(dfResponse);
			}
		});
		
		//handles a request to the route /getTable/541 for example
		// :nodeID is a parameter for any node that is a COLUMN
		// this route will run a cypher query that will return the given column node's:
		//		1. parent table node
		//		2. grandparent dataset node
		//		3. sibling column nodes
		get("/getTable/:nodeID", new Route() {
            public Object handle(Request request, Response response) {
            	// limit defines a limit on the length of the response if it is not defined in the request
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
            	
            	int nID = Integer.parseInt(request.params(":nodeID"));
                // The gson.toJson simply converts the given data to JSON format for sending it in an HTTP response.
            	// Here we are calling the getTable method which in the service object which will query neo4j for  
            	// a given column node ID's 1. parent table node 2. grandparent dataset node 3. sibling column nodes
            	return gson.toJson(service.getTable(nID, limit));
               
            }
        }); 
		
	}
}
