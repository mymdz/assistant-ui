import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { BackendAPI } from "../../../cloud";
import { RemoteThreadListAdapter } from "../types";
import { useBackendThreadHistoryAdapter } from "../../../cloud/BackendThreadHistoryAdapter";
import { RuntimeAdapterProvider } from "../../adapters/RuntimeAdapterProvider";
import { toCoreMessages } from "../../edge";
import { InMemoryThreadListAdapter } from "./in-memory";

type ThreadData = {
  externalId: string;
};

type BackendThreadListAdapterOptions = {
  backendApi?: BackendAPI | undefined;

  create?(): Promise<ThreadData>;
  delete?(threadId: string): Promise<void>;
};

const apiBaseUrl =
  typeof process !== "undefined" &&
  process?.env?.["NEXT_BACKEND_BASE_URL"];

const apiKey =
  typeof process !== "undefined" &&
  process?.env?.["NEXT_BACKEND_API_KEY"];



const backendAPI = apiBaseUrl
  ? new BackendAPI(apiBaseUrl, apiKey)
  : undefined;

export const useBackendThreadListAdapter = (
  adapter: BackendThreadListAdapterOptions,
): RemoteThreadListAdapter => {
  const adapterRef = useRef(adapter);
  useEffect(() => {
    adapterRef.current = adapter;
  }, [adapter]);

  const unstable_Provider = useCallback<FC<PropsWithChildren>>(
    function Provider({ children }) {
      const history = useBackendThreadHistoryAdapter({
        get current() {
          return adapterRef.current.backendApi ?? backendAPI!;
        },
      });
      const adapters = useMemo(() => ({ history }), [history]);

      return (
        <RuntimeAdapterProvider adapters={adapters}>
          {children}
        </RuntimeAdapterProvider>
      );
    },
    [],
  );

  const backendApi = adapter.backendApi ?? backendAPI;
  if (!backendApi) return new InMemoryThreadListAdapter();

  return {
    list: async () => {
      // const { threads } = await backendApi.threads.list();
      // return {
      //   threads: threads.map((t) => ({
      //     status: t.is_archived ? "archived" : "regular",
      //     remoteId: t.id,
      //     title: t.title,
      //     externalId: t.external_id ?? undefined,
      //   })),
      // };
      const threads = [{
        id: "thread-1",
        title: "Chat",
        is_archived: false,
        external_id: "external-id-1",
      }, {
        id: "thread-2",
        title: "Chat 2",
        is_archived: false,
        external_id: "external-id-2",
      }]

      return {
        threads: threads.map((t) => ({
          status: t.is_archived ? "archived" : "regular",
          remoteId: t.id,
          title: t.title,
          externalId: t.external_id ?? undefined,
        })),
      };
    },

    initialize: async () => {
      const createTask = adapter.create?.() ?? Promise.resolve();
      const t = await createTask;
      const external_id = t ? t.externalId : undefined;
      const { thread_id: remoteId } = await backendApi.threads.create({
        last_message_at: new Date(),
        external_id,
      });

      return { externalId: external_id, remoteId: remoteId };
    },

    rename: async (threadId, newTitle) => {
      return backendApi.threads.update(threadId, { title: newTitle });
    },
    archive: async (threadId) => {
      return backendApi.threads.update(threadId, { is_archived: true });
    },
    unarchive: async (threadId) => {
      return backendApi.threads.update(threadId, { is_archived: false });
    },
    delete: async (threadId) => {
      await adapter.delete?.(threadId);
      return backendApi.threads.delete(threadId);
    },

    generateTitle: async (threadId, messages) => {
      return backendApi.runs.stream({
        thread_id: threadId,
        assistant_id: "system/thread_title",
        messages: toCoreMessages(messages),
      });
    },

    unstable_Provider,
  };
};
