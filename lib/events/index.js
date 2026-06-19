const EventBus = require('./eventBus');
const EventStream = require('./eventStream');
const EventStore = require('./eventStore');
const EventReplayEngine = require('./eventReplayEngine');
const { EventSerializer, EVENT_SOURCES } = require('./eventSerializer');
const EventSchemaRegistry = require('./eventSchemaRegistry');
const EventRouter = require('./eventRouter');
const EventSubscriptions = require('./eventSubscriptions');
const EventFilters = require('./eventFilters');
const EventCorrelator = require('./eventCorrelator');
const { EventBackpressure, STRATEGIES } = require('./eventBackpressure');
const EventMetrics = require('./eventMetrics');
const EventDeadLetterQueue = require('./eventDeadLetterQueue');
const EventVersioning = require('./eventVersioning');
const intelligence = require('./intelligence');

const _defaultEventBus = new EventBus();
const _defaultEventStore = new EventStore();
const _defaultCorrelator = new EventCorrelator(_defaultEventBus);
const _defaultRouter = new EventRouter(_defaultEventBus);
const _defaultStream = new EventStream(_defaultEventBus);
const _defaultSubscriptions = new EventSubscriptions(_defaultEventBus);
const _defaultFilters = new EventFilters();
const _defaultMetrics = new EventMetrics();
const _defaultDeadLetterQueue = new EventDeadLetterQueue();
const _defaultVersioning = new EventVersioning();
const _defaultSchemaRegistry = _defaultEventBus.getSchemaRegistry();
const _defaultReplay = new EventReplayEngine(_defaultEventStore, _defaultEventBus);
const _defaultBackpressure = new EventBackpressure();

function emit(type, payload, options) {
  return _defaultEventBus.emit(type, payload, options);
}

function emitSync(type, payload, options) {
  return _defaultEventBus.emitSync(type, payload, options);
}

function on(type, handler) {
  return _defaultEventBus.on(type, handler);
}

function getEventBus() {
  return _defaultEventBus;
}

function getEventStore() {
  return _defaultEventStore;
}

function getEventStream() {
  return _defaultStream;
}

function getReplayEngine() {
  return _defaultReplay;
}

function getCorrelator() {
  return _defaultCorrelator;
}

function getRouter() {
  return _defaultRouter;
}

function getSubscriptions() {
  return _defaultSubscriptions;
}

function getFilters() {
  return _defaultFilters;
}

function getMetrics() {
  return _defaultMetrics;
}

function getDeadLetterQueue() {
  return _defaultDeadLetterQueue;
}

function getVersioning() {
  return _defaultVersioning;
}

function getSchemaRegistry() {
  return _defaultSchemaRegistry;
}

function getBackpressure() {
  return _defaultBackpressure;
}

function createEventBus(options) {
  return new EventBus(options);
}

module.exports = {
  emit,
  emitSync,
  on,
  getEventBus,
  getEventStore,
  getEventStream,
  getReplayEngine,
  getCorrelator,
  getRouter,
  getSubscriptions,
  getFilters,
  getMetrics,
  getDeadLetterQueue,
  getVersioning,
  getSchemaRegistry,
  getBackpressure,
  createEventBus,
  EventBus,
  EventStream,
  EventStore,
  EventReplayEngine,
  EventSerializer,
  EventSchemaRegistry,
  EventRouter,
  EventSubscriptions,
  EventFilters,
  EventCorrelator,
  EventBackpressure,
  EventMetrics,
  EventDeadLetterQueue,
  EventVersioning,
  EVENT_SOURCES,
  STRATEGIES,
  ...intelligence,
};
