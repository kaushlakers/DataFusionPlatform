package dataFusionPlatform.utility;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

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
    
    public static Map<String, Object> getMap(Object o) {
        Map<String, Object> result = new HashMap<String, Object>();
        Field[] declaredFields = o.getClass().getDeclaredFields();
        for (Field field : declaredFields) {
            try {
				result.put(field.getName(), field.get(o));
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IllegalAccessException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
        }
        return result;
    }
 }
