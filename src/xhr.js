import { fetch } from "./fetch.js"

export class EventListener {

  addEventListener(name, fn) {
    if (!this.listeners) { this.listeners = {}; }
    let list = this.listeners[name];
    if (!list) {
      list = this.listeners[name] = [];
    }
    list.push(fn);
  }

  removeEventListener(name, fn) {
    if (!this.listeners) { return; }
    let list = this.listeners[name];
    if (!list) { return; }
    let index = list.indexOf(fn);
    if (index < 0) { return; }
    list.splice(index, 1);
  }

  emit(name, event) {
    if (!this.listeners) { return; }
    let list = this.listeners[name];
    if (!list) { return; }
    for (let fn of list) {
      fn.call(this, event);
    }
    let fn = this[`on${name}`];
    if (fn) { fn.call(this, event); }
  }
}

export class XMLHttpRequest extends EventListener {

  open(method, url) {
    this.method = method
    this.url = url
  }
  send() {
    print("XHR", this.method, this.url);
    fetch(this.url, { method: this.method })
    .then(res => {
      this.status = res.status;
      print("XHR", this.status, this.url);
      this.statusText = res.statusText;
      this.redirected = res.redirected;
      this.headers = res.headers;
      if (this.responseType === "arraybuffer") {
        this.bodyField = "response";
        return res.arrayBuffer();
      } else {
        this.bodyField = "responseText";
        return res.text();
      }
    })
    .then(body => {
      this[this.bodyField] = body;
      this.emit("load", {});
    }, err => this.emit('error', err))
  }
}