<script lang="ts">
  import '../app.css';
  import ChatWidget from '$lib/components/ChatWidget.svelte';
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  <!-- Header -->
  <header class="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
    <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">💬</span>
        <h1 class="text-lg font-semibold text-slate-800">Spur Shop</h1>
      </div>
      <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        Support Online
      </span>
    </div>
  </header>

  <!-- Main Content -->
  <main class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8 text-center">
      <h2 class="text-2xl font-bold text-slate-800">How can we help you?</h2>
      <p class="mt-2 text-slate-500">
        Ask our AI support agent about orders, shipping, returns, or anything else.
      </p>
    </div>

    <!-- Example Questions -->
    <div class="mb-6 flex flex-wrap justify-center gap-2">
      <span class="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        What's your return policy?
      </span>
      <span class="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        Do you ship internationally?
      </span>
      <span class="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        How do I track my order?
      </span>
      <span class="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        What payment methods do you accept?
      </span>
    </div>

    <!-- Chat Widget -->
    <ChatWidget />
  </main>

  <!-- Footer -->
  <footer class="mt-auto border-t border-slate-200 bg-white/50 py-4 text-center text-sm text-slate-400">
    Powered by Spur — Customer Engagement Platform
  </footer>
</div>
