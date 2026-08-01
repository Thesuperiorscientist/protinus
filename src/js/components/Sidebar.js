export class Sidebar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.onLoad = null;
    this.onRandom = null;
    this.onUpload = null;
    this.onSettings = null;
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <h3>🔬 Load Structure</h3>
      <div class="input-group">
        <input class="pdb-input" type="text" maxlength="4" placeholder="PDB ID" />
        <button class="btn btn-primary" id="loadBtn">Load</button>
      </div>
      <div class="action-row" style="margin-top:8px;">
        <button class="btn btn-secondary" id="randomBtn">🎲 Random</button>
        <button class="btn btn-secondary" id="uploadBtn">📁 Upload</button>
      </div>
      
      <h3>🎨 Visualization</h3>
      <div class="control-group">
        <label>Representation</label>
        <select id="repType">
          <option value="cartoon">Cartoon</option>
          <option value="surface">Surface</option>
          <option value="ball+stick">Ball + Stick</option>
          <option value="spacefill">Spacefill</option>
        </select>
      </div>
      <div class="control-group">
        <label>Color Scheme</label>
        <select id="colorScheme">
          <option value="chainid">Chain</option>
          <option value="element">Element</option>
          <option value="resname">Residue</option>
          <option value="bfactor">B-factor</option>
        </select>
      </div>
      
      <h3>🔄 Animation</h3>
      <div class="control-group">
        <label>Spin Speed</label>
        <input type="range" id="speedControl" min="0" max="5" step="0.1" value="0.5" />
      </div>
      <div class="action-row">
        <button class="btn btn-secondary" id="resetBtn">Reset View</button>
      </div>
      
      <h3>📸 Actions</h3>
      <div class="action-row">
        <button class="btn btn-secondary" id="screenshotBtn">📸 Screenshot</button>
        <button class="btn btn-secondary" id="favBtn">⭐ Favorite</button>
      </div>
      
      <div style="margin-top:16px;color:var(--text-muted);font-size:12px;">
        Click a residue to add a note
      </div>
    `;
    
    // Events
    this.container.querySelector('#loadBtn').addEventListener('click', () => {
      const input = this.container.querySelector('.pdb-input');
      if (this.onLoad) this.onLoad(input.value);
    });
    
    this.container.querySelector('.pdb-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.container.querySelector('#loadBtn').click();
      }
    });
    
    this.container.querySelector('#randomBtn').addEventListener('click', () => {
      if (this.onRandom) this.onRandom();
    });
    
    this.container.querySelector('#uploadBtn').addEventListener('click', () => {
      if (this.onUpload) this.onUpload();
    });
    
    this.container.querySelector('#resetBtn').addEventListener('click', () => {
      // Reset view
      const viewer = window.__app?.viewer;
      if (viewer) {
        viewer.autoView();
        viewer.setSpin(0.5);
      }
    });
    
    this.container.querySelector('#screenshotBtn').addEventListener('click', () => {
      const viewer = window.__app?.viewer;
      if (viewer && viewer.stage) {
        viewer.stage.makeImage({ factor: 2, antialias: true }).then(blob => {
          NGL.download(blob, 'structure.png');
        });
      }
    });
    
    this.container.querySelector('#favBtn').addEventListener('click', () => {
      const app = window.__app;
      if (app && app.currentPdb) {
        const note = prompt('Optional note:');
        app.favorites.unshift({ pdbId: app.currentPdb, note: note || '', ts: new Date().toISOString() });
        app.storage.set('favorites', app.favorites);
        app.infoPanel.updateFavorites(app.favorites);
        app.notifications.show('Saved', `${app.currentPdb} added to favorites`, 'success');
      }
    });
  }
  
  setPDB(pdbId) {
    const input = this.container.querySelector('.pdb-input');
    if (input) input.value = pdbId;
  }
}