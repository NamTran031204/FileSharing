import { action, makeObservable, observable } from 'mobx';

class UiStore {
  /** Đếm số lần setBusy được gọi — clearBusy giảm xuống. Khi count > 0 → overlay hiện. */
  busyCount = 0;

  constructor() {
    makeObservable(this, {
      busyCount: observable,
      setBusy: action,
      clearBusy: action,
      resetBusy: action,
    });
  }

  get isBusy() {
    return this.busyCount > 0;
  }

  setBusy() {
    this.busyCount += 1;
  }

  clearBusy() {
    this.busyCount = Math.max(0, this.busyCount - 1);
  }

  resetBusy() {
    this.busyCount = 0;
  }
}

export default UiStore;
