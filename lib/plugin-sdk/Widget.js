class Widget {
  constructor(config) {
    this.id = config.id;
    this.title = config.title || config.id;
    this.description = config.description || '';
    this.width = config.width || 1;
    this.height = config.height || 1;
    this.category = config.category || 'general';
    this._renderer = config.renderer || (() => '<div>Empty widget</div>');
  }

  render(data) {
    return this._renderer(data);
  }

  setRenderer(fn) { this._renderer = fn; }
}

const createWidget = (config) => new Widget(config);

module.exports = { Widget, createWidget };
