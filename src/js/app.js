import { Viewer } from './core/viewer.js';
import { PDBService } from './api/pdb.js';
import { Storage } from './utils/storage.js';
import { Logger } from './utils/logger.js';
import { CONFIG } from './config/constants.js';

export default class App {
  constructor() {
    this.logger = new Logger('App');
    this.storage = new Storage('protinus_');
    this.pdbService = new PDBService();
    
    this.viewer = null;
    this.currentPdb = null;
    this.annotations = this.storage.get('annotations', {});
    this.favorites = this.storage.get('favorites', []);
    this.isLoading = false;
    
    this.init();
  }
  
  async init() {
    this.logger.info('Initializing...');
    this.createUI();
    
    this.viewer = new Viewer('viewport');
    await this.viewer.init();
    
    this.setupEvents();
    this.setupViewerClick();
    
    // Check URL for PDB ID
    const params = new URLSearchParams(window.location.search);
    const pdbId = params.get('pdb');
    if (pdbId) {
      document.getElementById('pdbInput').value = pdbId;
      this.loadPDB(pdbId);
    }
    
    // Show favorites
    this.renderFavorites();
    
    this.logger.info('Initialized');
    this.showNotification('Ready', 'Protinus is ready!', 'success');
  }
  
  createUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="app-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="header-btn" id="menuToggle">☰</button>
          <h1>Protinus</h1>
          <span class="version">v2.0</span>
        </div>
        <div>
          <button class="header-btn" id="fullscreenBtn">⛶</button>
        </div>
      </header>
      
      <div class="app-layout">
        <aside class="app-sidebar" id="sidebar">
          <h3>🔬 Load Structure</h3>
          <div class="input-group">
            <input id="pdbInput" type="text" maxlength="4" placeholder="PDB ID" />
            <button class="btn btn-primary" id="loadBtn">Load</button>
          </div>
          <div class="action-row" style="margin-top:8px;">
            <button class="btn btn-secondary" id="randomBtn">🎲 Random</button>
            <button class="btn btn-secondary" id="uploadBtn">📁 Upload</button>
          </div>
          
          <h3>🎨 Visualization</h3>
          <div class="control-group">
            <label for="repType">Representation</label>
            <select id="repType">
              <option value="cartoon">Cartoon</option>
              <option value="surface">Surface</option>
              <option value="ball+stick">Ball + Stick</option>
              <option value="spacefill">Spacefill</option>
              <option value="ribbon">Ribbon</option>
              <option value="trace">Trace</option>
            </select>
          </div>
          <div class="control-group">
            <label for="colorScheme">Color Scheme</label>
            <select id="colorScheme">
              <option value="chainid">Chain</option>
              <option value="element">Element</option>
              <option value="resname">Residue</option>
              <option value="bfactor">B-factor</option>
              <option value="secondary">Secondary Structure</option>
            </select>
          </div>
          <div class="control-group">
            <label for="bgColor">Background</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input id="bgColor" type="color" value="#071017" style="width:40px;height:32px;border-radius:6px;border:1px solid var(--border-color);cursor:pointer;background:transparent;padding:2px;" />
              <button class="btn btn-secondary btn-sm" id="toggleBgBtn">Toggle</button>
            </div>
          </div>
          
          <h3>🔄 Animation</h3>
          <div class="control-group">
            <label>Spin Speed</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" id="speedControl" min="0" max="5" step="0.1" value="0.5" style="flex:1;" />
              <span id="speedDisplay" style="min-width:32px;text-align:center;font-size:13px;color:var(--text-secondary);">0.5×</span>
            </div>
          </div>
          <div class="action-row">
            <button class="btn btn-secondary" id="resetViewBtn">🔄 Reset</button>
            <button class="btn btn-secondary" id="toggleSpinBtn">⏸️ Pause</button>
          </div>
          
          <h3>📸 Actions</h3>
          <div class="action-row">
            <button class="btn btn-secondary" id="screenshotBtn">📸 PNG</button>
            <button class="btn btn-secondary" id="favBtn">⭐ Favorite</button>
            <button class="btn btn-danger btn-sm" id="clearAnnoBtn">🗑️ Clear Notes</button>
          </div>
          
          <div style="margin-top:16px;color:var(--text-muted);font-size:12px;border-top:1px solid var(--border-color);padding-top:12px;">
            💡 Click any residue in the structure to add a note
          </div>
        </aside>
        
        <main class="app-viewport" id="viewport">
          <div class="overlay active" id="viewportOverlay">
            <div style="text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🧬</div>
              <p style="color:var(--text-secondary);">Enter a PDB ID to start</p>
              <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                ${CONFIG.EXAMPLES.map(id => `<button class="btn btn-secondary btn-sm example-btn" data-pdb="${id}">${id}</button>`).join('')}
              </div>
            </div>
          </div>
        </main>
        
        <aside class="app-info-panel" id="infoPanel">
          <div class="info-tabs">
            <button class="active" data-tab="info">📋 Info</button>
            <button data-tab="enrichment">🧬 Enrichment</button>
            <button data-tab="notes">📝 Notes</button>
            <button data-tab="favorites">⭐ Favorites</button>
          </div>
          <div class="info-content" id="infoContent">
            <div class="empty">Load a structure to see details</div>
          </div>
        </aside>
      </div>
      
      <div class="notifications" id="notifications"></div>
    `;
  }
  
  setupEvents() {
    // Load PDB
    document.getElementById('loadBtn').addEventListener('click', () => {
      const input = document.getElementById('pdbInput');
      this.loadPDB(input.value);
    });
    
    document.getElementById('pdbInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('loadBtn').click();
    });
    
    // Example buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('pdbInput').value = btn.dataset.pdb;
        this.loadPDB(btn.dataset.pdb);
      });
    });
    
    // Random
    document.getElementById('randomBtn').addEventListener('click', () => {
      const examples = CONFIG.EXAMPLES;
      const random = examples[Math.floor(Math.random() * examples.length)];
      document.getElementById('pdbInput').value = random;
      this.loadPDB(random);
    });
    
    // Upload
    document.getElementById('uploadBtn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdb,.cif,.mmtf,.gro';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) this.loadFile(file);
      };
      input.click();
    });
    
    // Representation
    document.getElementById('repType').addEventListener('change', () => {
      this.updateRepresentation();
    });
    
    document.getElementById('colorScheme').addEventListener('change', () => {
      this.updateRepresentation();
    });
    
    // Background
    document.getElementById('bgColor').addEventListener('input', (e) => {
      this.viewer.setBackground(e.target.value);
    });
    
    document.getElementById('toggleBgBtn').addEventListener('click', () => {
      const input = document.getElementById('bgColor');
      const current = input.value;
      const newColor = current === '#071017' ? '#ffffff' : '#071017';
      input.value = newColor;
      this.viewer.setBackground(newColor);
    });
    
    // Speed
    document.getElementById('speedControl').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('speedDisplay').textContent = val.toFixed(1) + '×';
      this.viewer.setSpin(val);
    });
    
    // Reset view
    document.getElementById('resetViewBtn').addEventListener('click', () => {
      this.viewer.autoView();
      this.viewer.setSpin(0.5);
      document.getElementById('speedControl').value = 0.5;
      document.getElementById('speedDisplay').textContent = '0.5×';
    });
    
    // Toggle spin
    let isSpinning = true;
    document.getElementById('toggleSpinBtn').addEventListener('click', () => {
      isSpinning = !isSpinning;
      this.viewer.setSpin(isSpinning ? 0.5 : 0);
      document.getElementById('toggleSpinBtn').textContent = isSpinning ? '⏸️ Pause' : '▶️ Play';
    });
    
    // Screenshot
    document.getElementById('screenshotBtn').addEventListener('click', () => {
      this.captureScreenshot();
    });
    
    // Favorite
    document.getElementById('favBtn').addEventListener('click', () => {
      this.addFavorite();
    });
    
    // Clear annotations
    document.getElementById('clearAnnoBtn').addEventListener('click', () => {
      this.clearAnnotations();
    });
    
    // Menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    
    // Fullscreen
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
    
    // Tab switching
    document.querySelectorAll('.info-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.info-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTab = btn.dataset.tab;
        this.refreshPanel();
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        document.getElementById('uploadBtn').click();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.captureScreenshot();
      }
      if (e.key === 'Escape') {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
    
    // Drag and drop
    const viewport = document.getElementById('viewport');
    viewport.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    viewport.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) this.loadFile(file);
    });
  }
  
  setupViewerClick() {
    this.viewer.onClick((pickingProxy) => {
      if (pickingProxy && pickingProxy.atom && this.currentPdb) {
        const atom = pickingProxy.atom;
        const label = `${atom.resname} ${atom.resno} (${atom.chainname})`;
        this.addAnnotation(label);
      }
    });
  }
  
  async loadPDB(pdbId) {
    if (!pdbId || this.isLoading) return;
    pdbId = pdbId.trim().toUpperCase();
    if (pdbId.length < 4) {
      this.showNotification('Error', 'Please enter a valid 4-character PDB ID', 'error');
      return;
    }
    
    this.isLoading = true;
    this.currentPdb = pdbId;
    this.showLoading(`Loading ${pdbId}...`);
    
    try {
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('pdb', pdbId);
      window.history.pushState({}, '', url);
      
      // Save state
      this.storage.set('state', { pdbId });
      
      // Load structure
      await this.viewer.load(pdbId);
      
      // Get metadata
      const meta = await this.pdbService.getMetadata(pdbId);
      this.updateInfo('info', meta);
      
      // Get enrichment
      const enrich = await this.pdbService.getEnrichment(pdbId);
      this.updateInfo('enrichment', enrich);
      
      // Load annotations
      this.renderAnnotations();
      
      this.hideLoading();
      this.showNotification('Success', `${pdbId} loaded successfully!`, 'success');
      
    } catch (error) {
      this.hideLoading();
      this.showNotification('Error', error.message || 'Failed to load structure', 'error');
      this.logger.error('Load failed:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  async loadFile(file) {
    this.showLoading(`Loading ${file.name}...`);
    
    try {
      const reader = new FileReader();
      const content = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      const ext = file.name.split('.').pop();
      await this.viewer.loadFromData(content, ext);
      this.currentPdb = file.name;
      
      this.hideLoading();
      this.showNotification('Success', `${file.name} loaded!`, 'success');
      
    } catch (error) {
      this.hideLoading();
      this.showNotification('Error', 'Failed to load file', 'error');
    }
  }
  
  updateRepresentation() {
    const type = document.getElementById('repType').value;
    const scheme = document.getElementById('colorScheme').value;
    this.viewer.updateRepresentation(type, scheme);
  }
  
  addAnnotation(residue) {
    const note = prompt(`Add note for ${residue}:`);
    if (note && this.currentPdb) {
      if (!this.annotations[this.currentPdb]) {
        this.annotations[this.currentPdb] = [];
      }
      this.annotations[this.currentPdb].push({
        residue,
        note,
        ts: new Date().toISOString()
      });
      this.storage.set('annotations', this.annotations);
      this.renderAnnotations();
      this.showNotification('Note added', `Annotation for ${residue} saved`, 'success');
    }
  }
  
  renderAnnotations() {
    const annotations = this.currentPdb ? this.annotations[this.currentPdb] || [] : [];
    this.updateInfo('notes', annotations);
  }
  
  clearAnnotations() {
    if (this.currentPdb && this.annotations[this.currentPdb]) {
      if (confirm('Delete all annotations for ' + this.currentPdb + '?')) {
        delete this.annotations[this.currentPdb];
        this.storage.set('annotations', this.annotations);
        this.renderAnnotations();
        this.showNotification('Cleared', 'All annotations removed', 'success');
      }
    }
  }
  
  addFavorite() {
    if (!this.currentPdb) {
      this.showNotification('Error', 'Load a structure first', 'error');
      return;
    }
    
    const note = prompt('Optional note for this favorite:');
    this.favorites = this.favorites.filter(f => f.pdbId !== this.currentPdb);
    this.favorites.unshift({
      pdbId: this.currentPdb,
      note: note || '',
      ts: new Date().toISOString()
    });
    
    if (this.favorites.length > 50) {
      this.favorites = this.favorites.slice(0, 50);
    }
    
    this.storage.set('favorites', this.favorites);
    this.renderFavorites();
    this.showNotification('Saved', `${this.currentPdb} added to favorites`, 'success');
  }
  
  renderFavorites() {
    this.updateInfo('favorites', this.favorites);
  }
  
  captureScreenshot() {
    if (!this.currentPdb) {
      this.showNotification('Error', 'Load a structure first', 'error');
      return;
    }
    
    this.viewer.capture().then(blob => {
      const name = this.currentPdb || 'structure';
      NGL.download(blob, `${name}_view.png`);
      this.showNotification('Captured', 'Screenshot saved', 'success');
    }).catch(() => {
      this.showNotification('Error', 'Failed to capture screenshot', 'error');
    });
  }
  
  updateInfo(type, data) {
    const content = document.getElementById('infoContent');
    const currentTab = document.querySelector('.info-tabs .active')?.dataset.tab || 'info';
    
    if (currentTab !== type && type !== 'info' && type !== 'enrichment') return;
    
    switch(type) {
      case 'info':
        content.innerHTML = `
          <div class="info-card">
            <div class="label">Structure</div>
            <div class="value">${data.title || 'Untitled'}</div>
          </div>
          <div class="info-card">
            <div class="label">Details</div>
            <div class="value">PDB: ${data.id || ''}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Method: ${data.method || 'N/A'}</div>
            <div style="font-size:12px;color:var(--text-muted);">Resolution: ${data.resolution || 'N/A'}</div>
            ${data.organism ? `<div style="font-size:12px;color:var(--text-muted);">Organism: ${data.organism}</div>` : ''}
          </div>
        `;
        break;
        
      case 'enrichment':
        let html = '';
        if (data.uniprot) {
          html += `
            <div class="info-card">
              <div class="label">UniProt</div>
              <div class="value"><strong>${data.uniprot.id}</strong></div>
              <div style="font-size:13px;color:var(--text-secondary);">${data.uniprot.name || ''}</div>
              ${data.uniprot.function ? `<div style="font-size:13px;color:var(--text-muted);margin-top:8px;">${data.uniprot.function.substring(0,200)}${data.uniprot.function.length > 200 ? '...' : ''}</div>` : ''}
            </div>
          `;
        }
        if (data.pubmed && data.pubmed.length) {
          html += `<div class="info-card"><div class="label">PubMed</div>`;
          data.pubmed.forEach(p => {
            html += `<div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">📄 ${p.title}</div>`;
          });
          html += `</div>`;
        }
        content.innerHTML = html || '<div class="empty">No enrichment data available</div>';
        break;
        
      case 'notes':
        if (!data || !data.length) {
          content.innerHTML = '<div class="empty">Click a residue in the viewer to add a note</div>';
          return;
        }
        let notesHtml = `<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:var(--text-secondary);">${data.length} notes</span>
        </div>`;
        data.slice().reverse().forEach(a => {
          notesHtml += `
            <div class="anno-item">
              <div style="flex:1;">
                <div class="residue">${a.residue}</div>
                <div class="note">${a.note}</div>
                <div class="time">${new Date(a.ts).toLocaleString()}</div>
              </div>
            </div>
          `;
        });
        content.innerHTML = notesHtml;
        break;
        
      case 'favorites':
        if (!data || !data.length) {
          content.innerHTML = '<div class="empty">No favorites saved yet</div>';
          return;
        }
        let favHtml = '';
        data.forEach(f => {
          favHtml += `
            <div class="fav-item">
              <div>
                <div class="pdb" data-pdb="${f.pdbId}">${f.pdbId}</div>
                ${f.note ? `<div class="note">${f.note}</div>` : ''}
              </div>
              <div class="fav-actions">
                <button class="load-fav" data-pdb="${f.pdbId}" title="Load">▶</button>
                <button class="delete delete-fav" data-pdb="${f.pdbId}" title="Remove">✕</button>
              </div>
            </div>
          `;
        });
        content.innerHTML = favHtml;
        
        content.querySelectorAll('.pdb, .load-fav').forEach(el => {
          el.addEventListener('click', () => {
            const pdb = el.dataset.pdb;
            document.getElementById('pdbInput').value = pdb;
            this.loadPDB(pdb);
          });
        });
        
        content.querySelectorAll('.delete-fav').forEach(el => {
          el.addEventListener('click', () => {
            const pdb = el.dataset.pdb;
            this.favorites = this.favorites.filter(f => f.pdbId !== pdb);
            this.storage.set('favorites', this.favorites);
            this.renderFavorites();
            this.showNotification('Removed', `${pdb} removed from favorites`, 'success');
          });
        });
        break;
    }
  }
  
  refreshPanel() {
    const currentTab = document.querySelector('.info-tabs .active')?.dataset.tab || 'info';
    // Re-render current tab content
  }
  
  showLoading(message) {
    const overlay = document.getElementById('viewportOverlay');
    overlay.innerHTML = `
      <div style="text-align:center;">
        <div class="spinner"></div>
        <p style="color:var(--text-secondary);margin-top:12px;">${message || 'Loading...'}</p>
      </div>
    `;
    overlay.classList.add('active');
  }
  
  hideLoading() {
    const overlay = document.getElementById('viewportOverlay');
    overlay.classList.remove('active');
  }
  
  showNotification(title, message, type = '') {
    const container = document.getElementById('notifications');
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.innerHTML = `
      <span class="icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <div class="msg"><strong>${title}</strong><span>${message}</span></div>
    `;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }
}