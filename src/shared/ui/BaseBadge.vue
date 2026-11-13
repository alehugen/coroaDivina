<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'primary' | 'accent' | 'warning' | 'danger' }>(), {
  tone: 'neutral',
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="{
      neutral: 'bg-surface-2 text-muted',
      primary: 'bg-primary-soft text-primary',
      accent: 'bg-accent text-on-accent',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
    }[tone]"
  >
    <slot />
  </span>
</template>
