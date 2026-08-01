export class InfoPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.onClearAnnotations = null;
    this.onLoadFavorite = null;
    this.onDeleteFavorite = null;
    this.currentTab = 'info';
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="info-tabs">
        <button class="active" data-tab="info">Info</button>
        <button data-tab="enrichment">Enrichment</button>
        <button data-tab="notes">Notes</button>
        <button data-tab="favorites">Favorites</button>
      </div>
      <div class="info-content" id="infoContent">
        <div class="empty">Load a structure to see details</div>
      </div>
    `;
    
    // Tab switching
    this.container.querySelectorAll('.info-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.info-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTab = btn.dataset.tab;
        this.refresh();
      });
    });
  }
  
  refresh() {
    // Re-render current tab content
    // This would need to store data and re-render
  }
  
  updateStructure(data) {
    const content = this.container.querySelector('#infoContent');
    if (this.currentTab === 'info') {
      content.innerHTML = `
        <div class="info-card">
          <div class="label">Structure</div>
          <div class="value">${data.title || 'Untitled'}</div>
        </div>
        <div class="info-card">
          <div class="label">Details</div>
          <div class="value">PDB: ${data.id || ''}</div>
          <div class="value" style="font-size:12px;color:var(--text-muted);">Method: ${data.method || 'N/A'}</div>
          <div class="value" style="font-size:12px;color:var(--text-muted);">Resolution: ${data.resolution || 'N/A'}</div>
        </div>
      `;
    }
  }
  
  updateEnrichment(data) {
    const content = this.container.querySelector('#infoContent');
    if (this.currentTab === 'enrichment') {
      let html = '';
      if (data.uniprot) {
        html += `
          <div class="info-card">
            <div class="label">UniProt</div>
            <div class="value"><strong>${data.uniprot.id}</strong></div>
            <div style="font-size:13px;color:var(--text-secondary);">${data.uniprot.name || ''}</div>
            ${data.uniprot.function ? `<div style="font-size:13px;color:var(--text-muted);margin-top:8px;">${data.uniprot.function.substring(0,200)}...</div>` : ''}
          </div>
        `;
      }
      if (data.pubmed && data.pubmed.length) {
        html += `<div class="info-card"><div class="label">PubMed</div>`;
        data.pubmed.forEach(p => {
          html += `<div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${p.title}</div>`;
        });
        html += `</div>`;
      }
      content.innerHTML = html || '<div class="empty">No enrichment data</div>';
    }
  }
  
  updateAnnotations(annotations) {
    const content = this.container.querySelector('#infoContent');
    if (this.currentTab === 'notes') {
      if (!annotations || !annotations.length) {
        content.innerHTML = '<div class="empty">Click a residue to add a note</div>';
        return;
      }
      let html = '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">';
      html += `<span style="font-size:13px;color:var(--text-secondary);">${annotations.length} notes</span>`;
      html += `<button class="btn btn-secondary btn-sm" id="clearNotes">Clear All</button></div>`;
      annotations.slice().reverse().forEach(a => {
        html += `
          <div class="anno-item">
            <div>
              <div class="residue">${a.residue}</div>
              <div class="note">${a.note}</div>
              <div class="time">${new Date(a.ts).toLocaleString()}</div>
            </div>
          </div>
        `;
      });
      content.innerHTML = html;
      content.querySelector('#clearNotes')?.addEventListener('click', () => {
        if (this.onClearAnnotations) this.onClearAnnotations();
      });
    }
  }
  
  updateFavorites(favorites) {
    const content = this.container.querySelector('#infoContent');
    if (this.currentTab === 'favorites') {
      if (!favorites || !favorites.length) {
        content.innerHTML = '<div class="empty">No favorites saved</div>';
        return;
      }
      let html = '';
      favorites.forEach(f => {
        html += `
          <div class="fav-item">
            <div>
              <div class="pdb" data-pdb="${f.pdbId}">${f.pdbId}</div>
              ${f.note ? `<div class="note">${f.note}</div>` : ''}
            </div>
            <div>
              <button class="load-fav" data-pdb="${f.pdbId}">▶</button>
              <button class="delete delete-fav" data-pdb="${f.pdbId}">✕</button>
            </div>
          </div>
        `;
      });
      content.innerHTML = html;
      content.querySelectorAll('.pdb, .load-fav').forEach(el => {
        el.addEventListener('click', () => {
          if (this.onLoadFavorite) this.onLoadFavorite(el.dataset.pdb);
        });
      });
      content.querySelectorAll('.delete-fav').forEach(el => {
        el.addEventListener('click', () => {
          if (this.onDeleteFavorite) this.onDeleteFavorite(el.dataset.pdb);
        });
      });
    }
  }
  
  showError(message) {
    const content = this.container.querySelector('#infoContent');
    content.innerHTML = `<div class="empty" style="color:#ff6b6b;">${message}</div>`;
  }
}