package dataFusionPlatform.entity;

import java.util.ArrayList;
import java.util.List;

public class DFDataset {
	
	private DFNode datasetNode;
	private List<DFNode> columnNodes;
	private List<DFNode> tableNodes;
	private List<DFRelation> relationships;
	public DFDataset() {
		columnNodes = new ArrayList<DFNode>();
		tableNodes = new ArrayList<DFNode>();
		relationships = new ArrayList<DFRelation>();
	}
	public DFNode getDatasetNode() {
		return datasetNode;
	}
	public void setDatasetNode(DFNode datasetNode) {
		this.datasetNode = datasetNode;
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
	public List<DFRelation> getRelationships() {
		return relationships;
	}
	public void setRelationships(List<DFRelation> relationships) {
		this.relationships = relationships;
	}

}
