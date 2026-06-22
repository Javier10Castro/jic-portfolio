class WorkflowExtension {
  constructor(config) {
    this.type = config.type;
    this.name = config.name || config.type;
    this.description = config.description || '';
    this._handler = config.handler || (() => {});
  }

  execute(context) {
    return this._handler(context);
  }

  setHandler(handler) { this._handler = handler; }
}

const createWorkflowExtension = (config) => new WorkflowExtension(config);

module.exports = { WorkflowExtension, createWorkflowExtension };
