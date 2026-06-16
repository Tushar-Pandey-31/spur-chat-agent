<script lang="ts">
  import type { ChatMessage } from '$lib/stores/chat.svelte';

  let { message }: { message: ChatMessage } = $props();

  const isUser = $derived(message.role === 'user');

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="flex {isUser ? 'justify-end' : 'justify-start'}" role="article" aria-label="{message.role} message">
  <div class="flex max-w-[80%] items-end gap-2 {isUser ? 'flex-row-reverse' : ''}">
    <!-- Avatar -->
    {#if !isUser}
      <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs">
        🤖
      </div>
    {/if}

    <!-- Bubble -->
    <div
      class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed
        {isUser
          ? 'bg-indigo-600 text-white rounded-br-md'
          : 'bg-slate-100 text-slate-800 rounded-bl-md'}"
    >
      <p class="whitespace-pre-wrap">{message.content}</p>
      <p class="mt-1 text-right text-[10px] opacity-60 {isUser ? 'text-indigo-200' : 'text-slate-400'}">
        {formatTime(message.timestamp)}
      </p>
    </div>
  </div>
</div>
