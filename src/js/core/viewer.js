import { Logger } from '../utils/logger.js';

export class Viewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.logger = new Logger('Viewer');
    this.stage = null;
    this.component = null;
    this.isReady = false;
    this.currentRepresentation = 'cartoon';
    this.currentColorScheme = 'chainid';
  }
  
  async init() {
    if (typeof NGL === 'undefined') {
      throw new Error('NGL.js not loaded');
    }
    
    this.stage = new NGL.Stage(this.container, {
      backgroundColor: '#071017',
      cameraType: 'perspective',
      quality: 'high'
    });
    
    this.stage.handleResize();
    this.isReady = true;
    this.logger.info('Initialized');
    return this;
  }
  
  async load(pdbId) {
    if (!this.isReady) await this.init();
    this.clear();
    
    try {
      this.component = await this.stage.loadFile(`rcsb://${pdbId}`, {
        defaultRepresentation: false,
        quality: 'high'
      });
      
      this.component.addRepresentation(this.currentRepresentation, {
        colorScheme: this.currentColorScheme,
        quality: 'high'
      });
      
      this.stage.autoView();
      this.stage.setSpin(true);
      this.stage.viewerControls.spinSpeed = 0.5;
      
      this.logger.info(`Loaded ${pdbId}`);
      return this.component;
      
    } catch (error) {
      this.logger.error('Load failed:', error);
      throw new Error(`Failed to load ${pdbId}: ${error.message}`);
    }
  }
  
  async loadFromData(data, ext) {
    this.clear();
    
    try {
      this.component = await this.stage.loadFile(data, {
        defaultRepresentation: false,
        ext: ext,
        quality: 'high'
      });
      
      this.component.addRepresentation(this.currentRepresentation, {
        colorScheme: this.currentColorScheme,
        quality: 'high'
      });
      
      this.stage.autoView();
      this.stage.setSpin(true);
      this.stage.viewerControls.spinSpeed = 0.5;
      
      return this.component;
      
    } catch (error) {
      throw new Error(`Failed to load file: ${error.message}`);
    }
  }
  
  updateRepresentation(type, colorScheme) {
    this.currentRepresentation = type || this.currentRepresentation;
    this.currentColorScheme = colorScheme || this.currentColorScheme;
    
    if (this.component) {
      this.component.removeAllRepresentations();
      this.component.addRepresentation(this.currentRepresentation, {
        colorScheme: this.currentColorScheme,
        quality: 'high'
      });
      this.stage.viewer.render();
    }
  }
  
  clear() {
    if (this.component) {
      this.stage.removeComponent(this.component);
      this.component = null;
    }
  }
  
  setBackground(color) {
    if (this.stage) {
      this.stage.viewer.controls.background = color;
      this.stage.viewer.render();
    }
  }
  
  setSpin(speed) {
    if (this.stage) {
      this.stage.setSpin(speed > 0);
      if (speed > 0) {
        this.stage.viewerControls.spinSpeed = speed;
      }
    }
  }
  
  autoView() {
    if (this.stage) {
      this.stage.autoView();
    }
  }
  
  handleResize() {
    if (this.stage) {
      this.stage.handleResize();
    }
  }
  
  capture(factor = 2) {
    return new Promise((resolve, reject) => {
      if (!this.stage) {
        reject(new Error('Viewer not initialized'));
        return;
      }
      this.stage.makeImage({
        factor: factor,
        antialias: true,
        transparent: false
      }).then(resolve).catch(reject);
    });
  }
  
  onClick(callback) {
    if (this.stage) {
      this.stage.signals.clicked.removeAll();
      this.stage.signals.clicked.add(callback);
    }
  }
}