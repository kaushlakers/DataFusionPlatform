package dataFusionPlatform.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import dataFusionPlatform.cypher.*;
import dataFusionPlatform.utility.*;
import spark.servlet.SparkApplication;
import spark.Request;
import spark.Response;
import spark.Route;
import spark.SparkBase;
import static spark.Spark.get;
import static spark.SparkBase.externalStaticFileLocation;

public class DFRoutes implements SparkApplication{

	private Gson gson = new GsonBuilder().disableHtmlEscaping().create();
    private DFService service = new DFService(Util.getNeo4jUrl());

	@Override
	public void init() 
	{
		// TODO Auto-generated method stub
		// TODO Auto-generated method stub
		get("/hello", new Route() {
            public Object handle(Request request, Response response) {
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
                
            	return gson.toJson(service.graph(limit));
               
            }
        });
               
            
		
		get("/graph", new Route() {
            public Object handle(Request request, Response response) {
            	int limit = request.queryParams("limit") != null ? Integer.valueOf(request.queryParams("limit")) : 100;
                
            	return gson.toJson(service.graph(limit));
               
            }
        });
		
	}
	/*
    public DFRoutes(DFService service) 
    {
        this.service = service;
    }
	
	
	public static void main(String[] args) 
	{
	    SparkBase.port(Util.getWebPort());
	    externalStaticFileLocation("WebContent");
	    final DFService service = new DFService(Util.getNeo4jUrl());
	    new DFRoutes(service).init();
	} */
	


}
