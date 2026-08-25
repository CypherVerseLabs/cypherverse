import {
  useCallback,
  useState,
} from "react";

import type {
  AIChatMessage,
  AIChatResult,
} from "../../../../server/ai/aiChatService";


export function useCyrusAI() {

  const [messages, setMessages] =
    useState<AIChatMessage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const sendMessage =
    useCallback(
      async (prompt: string) => {

        const cleanPrompt =
          prompt.trim();

        if (!cleanPrompt) {
          return null;
        }


        setLoading(true);
        setError(null);


        try {

          const response =
            await fetch(
              "/api/ai/starter",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  prompt:
                    cleanPrompt,

                  history:
                    messages,
                }),
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data?.error ||
              "Unable to contact Cyrus."
            );
          }


          const result =
            data as AIChatResult;


          setMessages(
            (previous) => [
              ...previous,

              {
                role: "user",
                content:
                  cleanPrompt,
              },

              {
                role: "assistant",
                content:
                  result.message,
              },
            ]
          );


          return result;

        } catch (err) {

          const message =
            err instanceof Error
              ? err.message
              : "Something went wrong.";


          setError(message);

          return null;

        } finally {

          setLoading(false);

        }

      },
      [messages]
    );


  const clearConversation =
    useCallback(() => {

      setMessages([]);

      setError(null);

    }, []);


  return {
    messages,
    loading,
    error,
    sendMessage,
    clearConversation,
  };
}