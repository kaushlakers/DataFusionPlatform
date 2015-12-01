package dataFusionPlatform.entity;

import java.util.ArrayList;
import java.util.List;

public class DFGraph {
	private List<DFNode> columnNodes;
	private List<DFNode> tableNodes;
	private List<DFNode> datasetNodes;
	private List<DFRelation> relationships;
	public DFGraph() {
		columnNodes = new ArrayList<DFNode>();
		tableNodes = new ArrayList<DFNode>();
		datasetNodes = new ArrayList<DFNode>();
		relationships = new ArrayList<DFRelation>();
	}
	public List<DFNode> getColumnNodes() {
		return columnNodes;
	}
	public void setColumnNodes(List<DFNode> columnNodes) {
		this.columnNodes = columnNodes;
	}
	public List<DFNode> getTableNodes() {
		return tableNodes;
	}
	public void setTableNodes(List<DFNode> tableNodes) {
		this.tableNodes = tableNodes;
	}
	public List<DFNode> getDatasetNodes() {
		return datasetNodes;
	}
	public void setDatasetNodes(List<DFNode> datasetNodes) {
		this.datasetNodes = datasetNodes;
	}
	public List<DFRelation> getRelationships() {
		return relationships;
	}
	public void setRelationships(List<DFRelation> relationships) {
		this.relationships = relationships;
	}


}
