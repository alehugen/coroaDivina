<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import type { Result } from '@/shared/lib/result'
import { BaseAlert, BaseButton, BaseSpinner, BaseSwitch, EmptyState, IconButton } from '@/shared/ui'
import { catalogo } from '../..'
import type { Area, AreaComFuncoes, FuncaoModelo } from '../../domain/Catalogo'
import AreaFormModal from '../components/AreaFormModal.vue'
import FuncaoFormModal from '../components/FuncaoFormModal.vue'
import { useCatalogStore } from '../stores/catalog'

const store = useCatalogStore()
onMounted(() => store.carregar())

const modalArea = ref(false)
const areaEditando = ref<Area | null>(null)
const modalFuncao = ref(false)
const funcaoEditando = ref<FuncaoModelo | null>(null)
const areaDaNovaFuncao = ref('')

function editarArea(a: Area | null) {
  areaEditando.value = a
  modalArea.value = true
}

function editarFuncao(f: FuncaoModelo | null, areaId: string) {
  funcaoEditando.value = f
  areaDaNovaFuncao.value = areaId
  modalFuncao.value = true
}

/** Executa, mostra erro se houver e recarrega. */
async function executar(acao: () => Promise<Result<void>>, sucesso?: string) {
  const r = await acao()
  if (!r.ok) return toast(r.error, 'danger')
  if (sucesso) toast(sucesso)
  await store.carregar()
}

async function removerArea(a: AreaComFuncoes) {
  const ok = await confirmar({
    titulo: `Excluir a área "${a.nome}"?`,
    mensagem: a.funcoes.length
      ? `As ${a.funcoes.length} funções dessa área também serão excluídas do catálogo. Áreas já usadas em escalas não podem ser excluídas.`
      : undefined,
    confirmar: 'Excluir',
    tom: 'danger',
  })
  if (ok) await executar(() => catalogo.removerArea(a.id), 'Área excluída.')
}

async function removerFuncao(f: FuncaoModelo) {
  const ok = await confirmar({
    titulo: `Excluir a função "${f.nome}" do catálogo?`,
    mensagem: 'Escalas já criadas não são afetadas. Para só deixar de usar em novas escalas, desative-a.',
    confirmar: 'Excluir',
    tom: 'danger',
  })
  if (ok) await executar(() => catalogo.removerFuncao(f.id), 'Função excluída.')
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="max-w-2xl text-sm text-muted">
        Áreas e funções usadas como base ao criar escalas. As vagas definidas aqui são o padrão; em
        cada escala é possível ajustar por dia.
      </p>
      <BaseButton class="shrink-0" @click="editarArea(null)">+ Nova área</BaseButton>
    </div>

    <BaseAlert v-if="store.erro" tone="danger">{{ store.erro }}</BaseAlert>

    <div v-if="store.carregando && !store.grupos.length" class="flex justify-center py-12 text-primary">
      <BaseSpinner class="size-6" />
    </div>

    <EmptyState v-else-if="!store.grupos.length" titulo="Nenhuma área cadastrada">
      <BaseButton class="mt-2" @click="editarArea(null)">Criar primeira área</BaseButton>
    </EmptyState>

    <article
      v-for="(a, ia) in store.grupos"
      :key="a.id"
      class="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <header
        class="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5"
        :style="{ boxShadow: `inset 4px 0 0 ${a.cor}` }"
      >
        <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: a.cor }" aria-hidden="true" />
        <h2 class="flex-1 font-semibold text-text">{{ a.nome }}</h2>
        <div class="flex items-center">
          <IconButton rotulo="Mover área para cima" :disabled="ia === 0" @click="executar(() => catalogo.moverArea(store.grupos, a.id, -1))">↑</IconButton>
          <IconButton rotulo="Mover área para baixo" :disabled="ia === store.grupos.length - 1" @click="executar(() => catalogo.moverArea(store.grupos, a.id, 1))">↓</IconButton>
          <IconButton rotulo="Editar área" @click="editarArea(a)">✎</IconButton>
          <IconButton rotulo="Excluir área" perigo @click="removerArea(a)">🗑</IconButton>
        </div>
      </header>

      <ul class="divide-y divide-border">
        <li
          v-for="(f, i) in a.funcoes"
          :key="f.id"
          class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
        >
          <div class="min-w-40 flex-1" :class="!f.ativo && 'opacity-50'">
            <p class="font-medium text-text">{{ f.nome }}</p>
            <p class="text-sm text-muted">
              {{ f.vagasResp }} responsável{{ f.vagasResp === 1 ? '' : 'is' }} ·
              {{ f.vagasAux }} auxiliar{{ f.vagasAux === 1 ? '' : 'es' }}
            </p>
          </div>
          <BaseSwitch
            :model-value="f.ativo"
            :rotulo="f.ativo ? 'Ativa' : 'Inativa'"
            mostrar-rotulo
            @update:model-value="executar(() => catalogo.alternarFuncao(f))"
          />
          <div class="flex items-center">
            <IconButton rotulo="Mover para cima" :disabled="i === 0" @click="executar(() => catalogo.moverFuncao(a.funcoes, f.id, -1))">↑</IconButton>
            <IconButton rotulo="Mover para baixo" :disabled="i === a.funcoes.length - 1" @click="executar(() => catalogo.moverFuncao(a.funcoes, f.id, 1))">↓</IconButton>
            <IconButton rotulo="Editar função" @click="editarFuncao(f, a.id)">✎</IconButton>
            <IconButton rotulo="Excluir função" perigo @click="removerFuncao(f)">🗑</IconButton>
          </div>
        </li>
        <li class="px-4 py-2 sm:px-5">
          <BaseButton variant="ghost" size="sm" @click="editarFuncao(null, a.id)">+ Nova função</BaseButton>
        </li>
      </ul>
    </article>

    <AreaFormModal v-model="modalArea" :area="areaEditando" />
    <FuncaoFormModal v-model="modalFuncao" :funcao="funcaoEditando" :area-id="areaDaNovaFuncao" />
  </section>
</template>
