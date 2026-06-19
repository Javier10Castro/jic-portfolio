const EventEmitter = require('events');

class ConversationEvents extends EventEmitter {
  constructor() {
    super();
    this._eventLog = [];
  }

  emitConversationCreated(conversationId, data) {
    const event = { type: 'conversation.created', conversationId, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit('conversation.created', event);
  }

  emitConversationUpdated(conversationId, data) {
    const event = { type: 'conversation.updated', conversationId, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit('conversation.updated', event);
  }

  emitConversationDeleted(conversationId, data) {
    const event = { type: 'conversation.deleted', conversationId, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit('conversation.deleted', event);
  }

  emitConversationSummarized(conversationId, data) {
    const event = { type: 'conversation.summarized', conversationId, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit('conversation.summarized', event);
  }

  getEventLog() {
    return [...this._eventLog];
  }

  clearEventLog() {
    this._eventLog = [];
  }
}

const conversationEvents = new ConversationEvents();

module.exports = { conversationEvents, ConversationEvents };
