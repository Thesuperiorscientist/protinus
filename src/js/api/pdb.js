import { Cache } from './cache.js';
import { Logger } from '../utils/logger.js';

export class PDBService {
  constructor() {
    this.cache = new Cache();
    this.logger = new Logger('PDB');
  }
  
  async getMetadata(pdbId) {
    const cached = this.cache.get(`meta_${pdbId}`);
    if (cached) return cached;
    
    try {
      const resp = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
      if (!resp.ok) throw new Error('PDB not found');
      const data = await resp.json();
      
      const result = {
        id: pdbId,
        title: data.struct?.title || 'Untitled',
        method: data.exptl?.[0]?.method || 'N/A',
        resolution: data.rcsb_entry_info?.resolution_combined?.[0] || 'N/A',
        organism: data.entity?.[0]?.rcsb_entity_source_organism?.[0]?.organism_scientific || ''
      };
      
      this.cache.set(`meta_${pdbId}`, result);
      return result;
      
    } catch (error) {
      this.logger.error('Metadata fetch failed:', error);
      throw new Error(`Failed to fetch metadata for ${pdbId}`);
    }
  }
  
  async getEnrichment(pdbId) {
    const cached = this.cache.get(`enrich_${pdbId}`);
    if (cached) return cached;
    
    const result = { uniprot: null, pubmed: [] };
    
    try {
      // UniProt
      const mapResp = await fetch(`https://www.ebi.ac.uk/pdbe/api/mappings/uniprot/${pdbId.toLowerCase()}`);
      if (mapResp.ok) {
        const mapData = await mapResp.json();
        const mapping = mapData[pdbId.toLowerCase()]?.UniProt;
        if (mapping) {
          const uniId = Object.keys(mapping)[0];
          const uniResp = await fetch(`https://rest.uniprot.org/uniprotkb/${uniId}.json`);
          if (uniResp.ok) {
            const uniData = await uniResp.json();
            let func = '';
            for (const cc of (uniData.comments || [])) {
              if (cc.commentType === 'FUNCTION' && cc.text && cc.text.length) {
                func = cc.text[0].value || '';
                break;
              }
            }
            result.uniprot = {
              id: uniId,
              name: uniData.proteinDescription?.recommendedName?.fullName?.value || '',
              function: func
            };
          }
        }
      }
    } catch (e) { this.logger.warn('UniProt failed:', e); }
    
    try {
      // PubMed
      const search = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${pdbId}+AND+structure&retmax=3&retmode=json`
      );
      if (search.ok) {
        const searchData = await search.json();
        const ids = searchData.esearchresult?.idlist || [];
        if (ids.length) {
          const summary = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
          );
          if (summary.ok) {
            const summaryData = await summary.json();
            result.pubmed = ids.map(id => ({
              id,
              title: summaryData.result?.[id]?.title || 'Article'
            }));
          }
        }
      }
    } catch (e) { this.logger.warn('PubMed failed:', e); }
    
    this.cache.set(`enrich_${pdbId}`, result);
    return result;
  }
}