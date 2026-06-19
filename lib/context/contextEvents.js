const EventEmitter = require('events');

class ContextEvents extends EventEmitter {
  constructor() {
    super();
    this._eventLog = [];
  }

  emitContextBuilt(conversationId, data) {
    const event = { type: 'context.built', conversationId, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit('context.built', event);
  }

  emitContextValidationFailed(conversationId, data) {
    const event = { type: 'context.validation.failed', conversationId, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit('context.validation.failed', event);
  }

  emitContextNormalized(conversationId, data) {
    const event = { type: 'context.normalized', conversationId, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit('context.normalized', event);
  }

  getEventLog() {
    return [...this._eventLog];
  }

  clearEventLog() {
    this._eventLog = [];
  }
}

const contextEvents = new ContextEvents();

module.exports = { contextEvents, ContextEvents };
