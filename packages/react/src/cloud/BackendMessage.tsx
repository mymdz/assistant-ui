import {ThreadMessageLike} from "@assistant-ui/react";

type TextMessage = {
    content: string;
    role: "assistant" | "user";
}

type MetricMessage = {
    metrics: string[],
    filters: string[],
    segments: string[],

    annotations: Record<string, string>,
    data: unknown,
}

export type BackendMessage = {
    type: "text" | "metric",
    message: (TextMessage| MetricMessage)
} ;

export const convertMessage = (message: BackendMessage): ThreadMessageLike => {
    switch (message.type) {
        case "text": {
            const textMessage = message.message as TextMessage;
            return {
                role: textMessage.role,
                content: [
                    {
                        type: "text",
                        text: textMessage.content,
                    },
                ]
            };
        }
        case "metric": {
            const metricMessage = message.message as MetricMessage;
            return {
                role: "assistant",
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(metricMessage),
                    },
                ],
                metadata: { custom: {} },
            };
        }
    }
};