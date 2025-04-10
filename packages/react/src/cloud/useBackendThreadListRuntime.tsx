"use client";

import { AssistantCloud } from "./AssistantCloud";
import { AssistantRuntime } from "../api";
import { useRemoteThreadListRuntime } from "../runtimes/remote-thread-list/useRemoteThreadListRuntime";
import { useCloudThreadListAdapter } from "../runtimes/remote-thread-list/adapter/cloud";
import { useBackendThreadListAdapter } from "../runtimes/remote-thread-list/adapter/backend";
import { BackendAPI } from "./BackendAPI";

type ThreadData = {
  externalId: string;
};

type BackendThreadListAdapter = {
  backendApi: BackendAPI;

  runtimeHook: () => AssistantRuntime;

  create?(): Promise<ThreadData>;
  delete?(threadId: string): Promise<void>;
};

export const useBackendThreadListRuntime = ({
  runtimeHook,
  ...adapterOptions
}: BackendThreadListAdapter) => {
  const adapter = useBackendThreadListAdapter(adapterOptions);
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: runtimeHook,
    adapter,
  });

  return runtime;
};
