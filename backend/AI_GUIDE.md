# AI Guide configuration

The ZInterns Guide works in built-in help mode without an AI provider. For open-ended, conversational answers, configure an OpenAI-compatible chat-completions provider in the **backend runtime environment**:

| Variable | Required | Default |
| --- | --- | --- |
| `AI_API_KEY` | Yes, to enable AI responses | Not set |
| `AI_CHAT_COMPLETIONS_URL` | No | `https://api.openai.com/v1/chat/completions` |
| `AI_MODEL` | No | `gpt-4o-mini` |

Set these variables in the backend host's secret/environment configuration and restart the backend. Do not put the API key in frontend variables or commit it to source control. The configured endpoint must accept the OpenAI chat-completions request format.

If no key is configured, the guide answers common questions about ZInterns features and clearly identifies when it cannot answer an open-ended question. Provider errors are shown in the chat instead of being silently replaced with generic answers. Requests have a 20-second timeout, and the chat endpoint is rate-limited. When enabled, chat messages and recent conversation history are sent to the configured provider; configure a provider approved for your organization's data.
