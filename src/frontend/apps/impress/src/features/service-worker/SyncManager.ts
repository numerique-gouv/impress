import { sleep } from '@/utils/system';

export class SyncManager {
  private _toSync: () => Promise<void>;
  private _hasSyncToDo: () => Promise<boolean>;
  private isSyncing = false;

  constructor(
    toSync: () => Promise<void>,
    hasSyncToDo: () => Promise<boolean>,
  ) {
    this._toSync = toSync;
    this._hasSyncToDo = hasSyncToDo;
    void this.sync();
  }

  public sync = async (syncAttempt = 0) => {
    const hasSyncToDo = await this._hasSyncToDo();

    if (!hasSyncToDo) {
      return;
    }

    // Wait for the other sync to finish
    const maxAttempts = 15;
    if (this.isSyncing && syncAttempt < maxAttempts) {
      await sleep(300);
      await this.sync(syncAttempt + 1);
      return;
    }

    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      await this._toSync();
    } catch (error) {
      console.error('SW-DEV: SyncManager.sync failed:', error);
    }

    this.isSyncing = false;
  };
}
