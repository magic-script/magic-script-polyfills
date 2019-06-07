let handlersKey = Symbol('EventHandlersKey');

export class Evented {
  constructor () {
    Object.defineProperty(this, handlersKey, { value: {} });
  }

  addEventListener (name, handler) {
    const eventHandlers = this[handlersKey];
    let list = eventHandlers[name];
    if (!list) eventHandlers[name] = list = [];
    list.push(handler);
  }

  removeEventListener (name, handler) {
    const list = this[handlersKey][name];
    if (!list) return;
    const index = list.indexOf(handler);
    if (index < 0) return;
    list.splice(index, 1);
  }

  emit (name, val) {
    const key = `on${name}`;
    let handlers = [];
    if (this[key]) handlers.push(this[key]);
    const eventHandlers = this[handlersKey];
    if (eventHandlers[name]) handlers = handlers.concat(eventHandlers[name]);
    if (handlers.length === 0) {
      if (name === 'error') {
        return Promise.reject(val);
      }
      return;
    }
    for (let handler of handlers) {
      try {
        handler.call(this, val);
      } catch (err) {
        Promise.reject(err);
      }
    }
  }
}
