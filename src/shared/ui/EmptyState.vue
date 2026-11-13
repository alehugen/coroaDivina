<script setup lang="ts">
import type { Component } from 'vue'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

defineProps<{ titulo: string; descricao?: string; icone?: Component }>()
</script>

<template>
  <Empty class="border bg-card">
    <EmptyHeader>
      <EmptyMedia v-if="icone" variant="icon">
        <component :is="icone" />
      </EmptyMedia>
      <EmptyTitle>{{ titulo }}</EmptyTitle>
      <EmptyDescription v-if="descricao">{{ descricao }}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.default">
      <slot />
    </EmptyContent>
  </Empty>
</template>
