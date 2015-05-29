package dataFusionPlatform.utility;

// Utility class for setting up server port and neo4j connection
public class Util 
{
	// this line defines the URL at which the Neo4j instance is running
	public static final String DEFAULT_URL = "http://localhost:7474";
    public static final String WEBAPP_LOCATION = "WebContent/";

    public static int getWebPort() 
    {
        String webPort = System.getenv("PORT");
        if(webPort == null || webPort.isEmpty()) 
        {
            return 8080;
        }
        return Integer.parseInt(webPort);
    }

    public static String getNeo4jUrl() 
    {
            return DEFAULT_URL;
    }
}
