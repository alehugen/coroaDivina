<script setup lang="ts">
import { computed } from 'vue'
import BaseSpinner from './BaseSpinner.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-50',
  {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }[props.size],
  {
    primary: 'bg-primary text-on-primary hover:bg-primary-hover',
    secondary: 'border border-border bg-surface text-text hover:bg-surface-2',
    ghost: 'text-text hover:bg-surface-2',
    danger: 'bg-danger text-white hover:opacity-90',
  }[props.variant],
  props.block && 'w-full',
])
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <BaseSpinner v-if="loading" class="size-4" />
    <slot />
  </button>
</template>
