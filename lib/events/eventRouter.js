class EventRouter {
  constructor(eventBus) {
    this._eventBus = eventBus;
    this._routes = new Map();
    this._routeHistory = [];
    this._maxHistory = 1000;
  }

  addRoute(typePattern, target, transform) {
    const routeId = 'route-' + Math.random().toString(36).substring(2, 10);
    const handler = (event) => {
      if (!this._matches(event.type, typePattern)) return;
      const payload = transform ? transform(event) : event.payload;
      this._routeHistory.push({ routeId, eventId: event.id, type: event.type, target, timestamp: Date.now() });
      if (this._routeHistory.length > this._maxHistory) this._routeHistory.shift();
      if (typeof target === 'function') {
        target(event, payload);
      } else if (target === 'eventBus' && this._eventBus) {
        this._eventBus.emit(event.type, payload, {
          source: 'router',
          correlationId: event.correlationId,
          metadata: { ...event.metadata, routedFrom: event.source },
        });
      }
    };
    const off = this._eventBus.on('*', handler);
    this._routes.set(routeId, { typePattern, target, handler, off });
    return routeId;
  }

  removeRoute(routeId) {
    const route = this._routes.get(routeId);
    if (!route) return false;
    route.off();
    this._routes.delete(routeId);
    return true;
  }

  addSubsystemRoute(sourceType, targetType, transform) {
    return this.addRoute(sourceType, {
      type: 'subsystem',
      targetType,
      transform,
    }, (event) => {
      const targetEventType = targetType || event.type;
      const payload = transform ? transform(event) : event.payload;
      if (this._eventBus) {
        this._eventBus.emit(targetEventType, payload, {
          source: event.source,
          correlationId: event.correlationId,
          metadata: { ...event.metadata, subsystemRoute: true },
        });
      }
    });
  }

  listRoutes() {
    const result = [];
    for (const [id, route] of this._routes) {
      result.push({ id, typePattern: route.typePattern, target: route.target });
    }
    return result;
  }

  getRouteHistory(limit = 50) {
    return this._routeHistory.slice(-limit);
  }

  routeCount() {
    return this._routes.size;
  }

  _matches(type, pattern) {
    if (pattern === '*' || pattern === type) return true;
    const parts = pattern.split('.');
    const typeParts = type.split('.');
    if (parts.length !== typeParts.length) return false;
    return parts.every((p, i) => p === '*' || p === typeParts[i]);
  }

  clearRoutes() {
    for (const [, route] of this._routes) route.off();
    this._routes.clear();
    this._routeHistory = [];
  }
}

module.exports = EventRouter;
