<script setup lang="ts">
import { computed } from 'vue'
import { formatarTelefone } from '@/modules/identity/domain/Telefone'
import { formatarData } from '@/shared/lib/datas'
import { AvatarIniciais, BaseBadge, BaseButton } from '@/shared/ui'
import { linkWhatsApp, type AcoesSocio, type Socio } from '../../domain/Socio'

const props = defineProps<{
  socio: Socio
  acoes: AcoesSocio
  isOrga: boolean
  euMesmo: boolean
  ocupado: boolean
}>()

const emit = defineEmits<{ acao: [acao: keyof AcoesSocio] }>()

const whatsapp = computed(() => linkWhatsApp(props.socio.telefone))
</script>

<template>
  <li class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <AvatarIniciais :nome="socio.nome" />
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-1.5 font-medium text-text">
          <span class="truncate">{{ socio.nome }}</span>
          <span v-if="euMesmo" class="text-xs font-normal text-muted">(você)</span>
          <BaseBadge v-if="socio.role === 'admin'" tone="primary">Admin</BaseBadge>
          <BaseBadge v-if="isOrga" tone="accent">Orgã</BaseBadge>
          <BaseBadge v-if="socio.status === 'rejeitado'" tone="danger">Rejeitado</BaseBadge>
          <BaseBadge v-if="socio.status === 'inativo'">Inativo</BaseBadge>
        </p>
        <p class="truncate text-sm text-muted">{{ socio.email }}</p>
        <p class="text-sm text-muted">
          <a
            v-if="whatsapp"
            :href="whatsapp"
            target="_blank"
            rel="noopener"
            class="hover:text-primary hover:underline"
            >{{ formatarTelefone(socio.telefone) }}</a
          >
          <span v-else>Sem telefone</span>
          <span class="mx-1.5">·</span>
          <span>cadastro em {{ formatarData(socio.criadoEm) }}</span>
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 sm:justify-end">
      <BaseButton v-if="acoes.aprovar" size="sm" :loading="ocupado" @click="emit('acao', 'aprovar')">
        Aprovar
      </BaseButton>
      <BaseButton v-if="acoes.rejeitar" size="sm" variant="secondary" :disabled="ocupado" @click="emit('acao', 'rejeitar')">
        Rejeitar
      </BaseButton>
      <BaseButton v-if="acoes.reativar" size="sm" :loading="ocupado" @click="emit('acao', 'reativar')">
        Reativar
      </BaseButton>
      <BaseButton v-if="acoes.tornarAdmin" size="sm" variant="secondary" :disabled="ocupado" @click="emit('acao', 'tornarAdmin')">
        Tornar admin
      </BaseButton>
      <BaseButton v-if="acoes.removerAdmin" size="sm" variant="secondary" :disabled="ocupado" @click="emit('acao', 'removerAdmin')">
        Remover admin
      </BaseButton>
      <BaseButton v-if="acoes.desativar" size="sm" variant="ghost" :disabled="ocupado" @click="emit('acao', 'desativar')">
        Desativar
      </BaseButton>
    </div>
  </li>
</template>
