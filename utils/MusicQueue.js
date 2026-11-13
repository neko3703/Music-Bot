import { MAX_QUEUE_SIZE } from "../constants/musicConfig.js";

export default class MusicQueue {
  constructor() {
    this._queue = [];
  }

  get length() {
    return this._queue.length;
  }

  add(track) {
    if (this._queue.length >= MAX_QUEUE_SIZE) {
      throw new RangeError("The music queue is full.");
    }
    this._queue.push(track);
  }

  addFront(track) {
    if (this._queue.length >= MAX_QUEUE_SIZE) {
      throw new RangeError("The music queue is full.");
    }
    this._queue.unshift(track);
  }

  getNext() {
    return this._queue.shift() ?? null;
  }

  remove(index) {
    if (index < 1 || index > this._queue.length) {
      throw new RangeError("Invalid queue position.");
    }
    return this._queue.splice(index - 1, 1)[0];
  }

  move(oldIndex, newIndex) {
    if (oldIndex < 1 || oldIndex > this._queue.length) {
      throw new RangeError("Invalid original queue position.");
    }
    if (newIndex < 1 || newIndex > this._queue.length) {
      throw new RangeError("Invalid destination queue position.");
    }
    const [track] = this._queue.splice(oldIndex - 1, 1);
    this._queue.splice(newIndex - 1, 0, track);
  }

  shuffle() {
    for (let i = this._queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._queue[i], this._queue[j]] = [this._queue[j], this._queue[i]];
    }
  }

  all() {
    return [...this._queue];
  }

  clear() {
    this._queue = [];
  }
}