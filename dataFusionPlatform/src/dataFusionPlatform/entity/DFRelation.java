package dataFusionPlatform.entity;

import java.util.Map;

public class DFRelation {
	
	private int id;
	private int from;
	private int to;
	private boolean dashes;
	
	public DFRelation(int id, int from, int to, boolean dashes) {
		super();
		this.id = id;
		this.from = from;
		this.to = to;
		this.dashes = dashes;
	}
	
	/**
	 * Constructor takes map that contains parent and child node ids
	 * @param relMap 
	 * @param lineType
	 */
	public DFRelation(int id, Map<String, Object> relMap, boolean dashes) {
		this(id, (int) relMap.get("parent"),
				(int) relMap.get("child"), dashes);
	}

	public int getFrom() {
		return from;
	}

	public void setFrom(int from) {
		this.from = from;
	}

	public int getTo() {
		return to;
	}

	public void setTo(int to) {
		this.to = to;
	}

	public boolean isDashes() {
		return dashes;
	}

	public void setDashes(boolean dashes) {
		this.dashes = dashes;
	}

	
		
}
