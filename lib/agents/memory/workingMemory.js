class WorkingMemory {
  constructor() {
    this._state = {};
    this._stack = [];
    this._maxStack = 50;
  }

  setState(key, value) {
    this._state[key] = value;
  }

  getState(key) {
    return this._state[key];
  }

  getAllState() {
    return { ...this._state };
  }

  pushFrame(frame) {
    this._stack.push({ ...frame, timestamp: Date.now() });
    if (this._stack.length > this._maxStack) {
      this._stack.shift();
    }
  }

  popFrame() {
    return this._stack.pop() || null;
  }

  peekFrame() {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1] : null;
  }

  getStack() {
    return [...this._stack];
  }

  clear() {
    this._state = {};
    this._stack = [];
  }
}

module.exports = WorkingMemory;
