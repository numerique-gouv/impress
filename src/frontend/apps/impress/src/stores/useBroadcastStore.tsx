import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { create } from 'zustand';

interface BroadcastState {
  addTask: (taskLabel: string, action: () => void) => void;
  broadcast: (taskLabel: string) => void;
  getBroadcastProvider: () => HocuspocusProvider | undefined;
  provider?: HocuspocusProvider;
  setBroadcastProvider: (provider: HocuspocusProvider) => void;
  tasks: { [taskLabel: string]: Y.Array<string> };
}

export const useBroadcastStore = create<BroadcastState>((set, get) => ({
  provider: undefined,
  tasks: {},
  setBroadcastProvider: (provider) => set({ provider }),
  getBroadcastProvider: () => {
    const provider = get().provider;
    if (!provider) {
      console.warn('Provider is not defined');
      return;
    }

    return provider;
  },
  addTask: (taskLabel, action) => {
    const taskExistAlready = get().tasks[taskLabel];
    const provider = get().getBroadcastProvider();
    if (taskExistAlready || !provider) {
      return;
    }

    const task = provider.document.getArray<string>(taskLabel);
    task.observe(() => {
      action();
    });

    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskLabel]: task,
      },
    }));
  },
  broadcast: (taskLabel) => {
    const task = get().tasks[taskLabel];
    if (!task) {
      console.warn(`Task ${taskLabel} is not defined`);
      return;
    }
    task.push([`broadcast: ${taskLabel}`]);
  },
}));
