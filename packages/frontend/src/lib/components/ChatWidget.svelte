<script lang="ts">
  import { chatStore } from '$lib/stores/chat.svelte';
  import { sendMessage, loadHistory } from '$lib/api/client';
  import MessageBubble from './MessageBubble.svelte';
  import TypingIndicator from './TypingIndicator.svelte';

  let chatContainer = $state<HTMLDivElement>();
  let inputMessage = $state('');

  // Auto-scroll to bottom on new messages
  $effect(() => {
    const _ = chatStore.messages.length;
    if (chatContainer) {
      requestAnimationFrame(() => {
        chatContainer!.scrollTop = chatContainer!.scrollHeight;
      });
    }
  });

  // Load history on mount if we have a sessionId
  $effect(() => {
    const sid = chatStore.sessionId;
    if (sid) {
      loadHistory(sid)
        .then((data) => {
          chatStore.loadFromHistory(data.messages);
        })
        .catch(() => {
          // Session expired or not found — start fresh
        });
    }
  });

  async function handleSend() {
    const message = inputMessage.trim();
    if (!message || chatStore.isLoading) return;

    inputMessage = '';
    chatStore.clearError();
    chatStore.addUserMessage(message);
    chatStore.setLoading(true);

    try {
      const result = await sendMessage(message, chatStore.sessionId ?? undefined);
      chatStore.addAssistantMessage(result.reply);
      chatStore.setSessionId(result.sessionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      chatStore.setError(msg);
      chatStore.addAssistantMessage(`Sorry, I encountered an error: ${msg}`);
    } finally {
      chatStore.setLoading(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
  <!-- Chat Header -->
  <div class="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm">
      🤖
    </div>
    <div>
      <p class="text-sm font-medium text-slate-700">Spur Support Agent</p>
      <p class="text-xs text-slate-400">AI-powered • Usually responds instantly</p>
    </div>
  </div>

  <!-- Messages -->
  <div
    bind:this={chatContainer}
    class="flex h-96 flex-col gap-3 overflow-y-auto p-4"
    role="log"
    aria-label="Chat messages"
    aria-live="polite"
  >
    {#if chatStore.messages.length === 0 && !chatStore.isLoading}
      <div class="m-auto text-center text-slate-400">
        <p class="text-4xl">👋</p>
        <p class="mt-2 text-sm">Hi! How can I help you today?</p>
      </div>
    {/if}

    {#each chatStore.messages as message (message.id)}
      <MessageBubble {message} />
    {/each}

    {#if chatStore.isLoading}
      <TypingIndicator />
    {/if}
  </div>

  <!-- Error Banner -->
  {#if chatStore.error}
    <div class="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
      ⚠️ {chatStore.error}
      <button
        class="ml-2 underline hover:text-red-800"
        onclick={() => chatStore.clearError()}
      >
        Dismiss
      </button>
    </div>
  {/if}

  <!-- Input -->
  <div class="border-t border-slate-100 p-3">
    <div class="flex gap-2">
      <input
        bind:value={inputMessage}
        onkeydown={handleKeydown}
        type="text"
        placeholder="Type your message..."
        disabled={chatStore.isLoading}
        maxlength={4000}
        class="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm
          placeholder:text-slate-400
          focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
          disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Message input"
      />
      <button
        onclick={handleSend}
        disabled={!inputMessage.trim() || chatStore.isLoading}
        class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white
          hover:bg-indigo-700
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50
          disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Send message"
      >
        {#if chatStore.isLoading}
          <span class="inline-block animate-spin">⏳</span>
        {:else}
          Send
        {/if}
      </button>
    </div>
    <p class="mt-1.5 text-xs text-slate-400">
      Press Enter to send • Shift+Enter for newline • Max 4000 characters
    </p>
  </div>
</div>
