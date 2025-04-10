import { BackendMessage } from "./BackendMessage";


export class BackendAPI {
    constructor(
        private readonly apiBaseUrl: string,
        private apiKey: string,
    ) {
        this.apiBaseUrl = apiBaseUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
    }

    async *loadChatMessage(message:  string, abortSignal: AbortSignal, chatId: string): AsyncGenerator<BackendMessage, void> {
        const response = await fetch(this.apiBaseUrl + "/v1/load", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Chat-ID": chatId as string,
                "Authorization": "Bearer GCO9vwzZl61m",
            },
            // forward the messages in the chat to the API
            body: JSON.stringify({
                chatId,
                message,
            }),
            // if the user hits the "cancel" button or escape keyboard key, cancel the request
            signal: abortSignal,
        });

        if (response.body === null) {
            throw new Error("Response body is null");
        }

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        if (response.headers.get("content-type") !== "text/event-stream") {
            const j = await response.json()
            throw new Error(`Error (no streaming): ${j.error}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split("\n");
            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;

                const json = line.slice(6).trim();
                if (json === "[DONE]") return;

                yield JSON.parse(json) as BackendMessage;
            }
        }
    }
}