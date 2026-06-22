class GeneratorExtension {
  constructor(config) {
    this.name = config.name;
    this.description = config.description || '';
    this.templateType = config.templateType || 'page';
    this._generator = config.generator || (() => ({}));
  }

  generate(input, context) {
    return this._generator(input, context);
  }

  setGenerator(fn) { this._generator = fn; }
}

const createGeneratorExtension = (config) => new GeneratorExtension(config);

module.exports = { GeneratorExtension, createGeneratorExtension };
