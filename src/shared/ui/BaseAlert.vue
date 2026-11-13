<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'info' | 'success' | 'warning' | 'danger' }>(), {
  tone: 'info',
})
</script>

<template>
  <div
    role="alert"
    class="rounded-lg border px-4 py-3 text-sm"
    :class="{
      info: 'border-primary/30 bg-primary-soft text-text',
      success: 'border-success/40 bg-primary-soft text-text',
      warning: 'border-warning/40 bg-warning-soft text-text',
      danger: 'border-danger/40 bg-danger-soft text-danger',
    }[tone]"
  >
    <slot />
  </div>
</template>
