/**
 * @jest-environment node
 */

import '@testing-library/jest-dom';

import { SyncManager } from '../SyncManager';

const mockedSleep = jest.fn();
jest.mock('@/utils/system', () => ({
  sleep: jest.fn().mockImplementation((ms) => mockedSleep(ms)),
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SyncManager', () => {
  afterEach(() => jest.clearAllMocks());

  it('checks SyncManager no sync to do', async () => {
    const toSync = jest.fn();
    const hasSyncToDo = jest.fn().mockResolvedValue(false);
    new SyncManager(toSync, hasSyncToDo);

    await delay(100);

    expect(hasSyncToDo).toHaveBeenCalled();
    expect(toSync).not.toHaveBeenCalled();
  });

  it('checks SyncManager sync to do', async () => {
    const toSync = jest.fn();
    const hasSyncToDo = jest.fn().mockResolvedValue(true);
    new SyncManager(toSync, hasSyncToDo);

    await delay(100);

    expect(hasSyncToDo).toHaveBeenCalled();
    expect(toSync).toHaveBeenCalled();
  });

  it('checks SyncManager sync to do trigger error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const toSync = jest.fn().mockRejectedValue(new Error('error'));
    const hasSyncToDo = jest.fn().mockResolvedValue(true);
    new SyncManager(toSync, hasSyncToDo);

    await delay(100);

    expect(hasSyncToDo).toHaveBeenCalled();
    expect(toSync).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'SW-DEV: SyncManager.sync failed:',
      new Error('error'),
    );
  });

  it('checks SyncManager multiple sync to do', async () => {
    const toSync = jest.fn().mockReturnValue(delay(200));
    const hasSyncToDo = jest.fn().mockResolvedValue(true);
    const syncManager = new SyncManager(toSync, hasSyncToDo);

    await syncManager.sync();

    expect(hasSyncToDo).toHaveBeenCalled();
    expect(mockedSleep).toHaveBeenCalledWith(300);
    expect(mockedSleep).toHaveBeenCalledTimes(15);
    expect(toSync).toHaveBeenCalledTimes(1);
  });
});
