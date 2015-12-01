package dataFusionPlatform.entity;

import java.util.ArrayList;
import java.util.List;

public class DFResponse {
	
	private List<DFDataset> datasets;
	private List<DFRelation> crossDatasetLinks;
	
	public DFResponse() {
		datasets = new ArrayList<DFDataset>();
		crossDatasetLinks = new ArrayList<DFRelation>();
	}
	
	public DFResponse(List<DFDataset> datasets, List<DFRelation> crossDatasetLinks) {
		super();
		this.datasets = datasets;
		this.crossDatasetLinks = crossDatasetLinks;
	}

	public List<DFDataset> getDatasets() {
		return datasets;
	}

	public void setDatasets(List<DFDataset> datasets) {
		this.datasets = datasets;
	}

	public List<DFRelation> getCrossDatasetLinks() {
		return crossDatasetLinks;
	}

	public void setCrossDatasetLinks(List<DFRelation> crossDatasetLinks) {
		this.crossDatasetLinks = crossDatasetLinks;
	}
	

}
