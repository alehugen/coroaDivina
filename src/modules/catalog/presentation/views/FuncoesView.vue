<script setup lang="ts">
import {
  PhArrowDown,
  PhArrowUp,
  PhDotsThreeVertical,
  PhListChecks,
  PhPencilSimple,
  PhPlus,
  PhTrash,
  PhWarningCircle,
} from '@phosphor-icons/vue'
import { onMounted, ref } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import type { Result } from '@/shared/lib/result'
import { CarregandoConteudo, EmptyState } from '@/shared/ui'
import { catalogo } from '../..'
import type { Area, AreaComFuncoes, FuncaoModelo } from '../../domain/Catalogo'
import AreaFormDialog from '../components/AreaFormDialog.vue'
import FuncaoFormDialog from '../components/FuncaoFormDialog.vue'
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
      <p class="max-w-2xl text-sm text-muted-foreground">
        Áreas e funções usadas como base ao criar escalas. As vagas definidas aqui são o padrão; em cada
        escala é possível ajustar por dia.
      </p>
      <Button size="lg" class="shrink-0" @click="editarArea(null)"><PhPlus /> Nova área</Button>
    </div>

    <Alert v-if="store.erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ store.erro }}</AlertDescription>
    </Alert>

    <CarregandoConteudo v-if="store.carregando && !store.grupos.length" forma="lista" />

    <EmptyState v-else-if="!store.grupos.length" :icone="PhListChecks" titulo="Nenhuma área cadastrada">
      <Button @click="editarArea(null)"><PhPlus /> Criar primeira área</Button>
    </EmptyState>

    <article v-for="(a, ia) in store.grupos" :key="a.id" class="overflow-hidden rounded-xl border bg-card">
      <header class="flex items-center gap-3 border-b px-4 py-2.5 sm:px-5" :style="{ boxShadow: `inset 4px 0 0 ${a.cor}` }">
        <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: a.cor }" aria-hidden="true" />
        <h2 class="flex-1 font-semibold">{{ a.nome }}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon-lg" :aria-label="`Ações da área ${a.nome}`">
              <PhDotsThreeVertical class="size-5" weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="editarArea(a)"><PhPencilSimple /> Editar</DropdownMenuItem>
            <DropdownMenuItem :disabled="ia === 0" @select="executar(() => catalogo.moverArea(store.grupos, a.id, -1))">
              <PhArrowUp /> Mover para cima
            </DropdownMenuItem>
            <DropdownMenuItem
              :disabled="ia === store.grupos.length - 1"
              @select="executar(() => catalogo.moverArea(store.grupos, a.id, 1))"
            >
              <PhArrowDown /> Mover para baixo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" @select="removerArea(a)"><PhTrash /> Excluir área</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <ul class="divide-y">
        <li v-for="(f, i) in a.funcoes" :key="f.id" class="flex items-center gap-3 px-4 py-3 sm:px-5">
          <Switch
            :model-value="f.ativo"
            :aria-label="`${f.nome}: ${f.ativo ? 'ativa' : 'inativa'} para novas escalas`"
            @update:model-value="executar(() => catalogo.alternarFuncao(f))"
          />
          <button type="button" class="min-w-0 flex-1 text-left" :class="!f.ativo && 'opacity-50'" @click="editarFuncao(f, a.id)">
            <p class="truncate font-medium">{{ f.nome }}</p>
            <p class="text-sm text-muted-foreground">
              {{ f.vagasResp }} responsável{{ f.vagasResp === 1 ? '' : 'is' }} · {{ f.vagasAux }} auxiliar{{
                f.vagasAux === 1 ? '' : 'es'
              }}
            </p>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-lg" :aria-label="`Ações da função ${f.nome}`">
                <PhDotsThreeVertical class="size-5" weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="editarFuncao(f, a.id)"><PhPencilSimple /> Editar</DropdownMenuItem>
              <DropdownMenuItem :disabled="i === 0" @select="executar(() => catalogo.moverFuncao(a.funcoes, f.id, -1))">
                <PhArrowUp /> Mover para cima
              </DropdownMenuItem>
              <DropdownMenuItem
                :disabled="i === a.funcoes.length - 1"
                @select="executar(() => catalogo.moverFuncao(a.funcoes, f.id, 1))"
              >
                <PhArrowDown /> Mover para baixo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="removerFuncao(f)"><PhTrash /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
        <li class="px-3 py-2 sm:px-4">
          <Button variant="ghost" class="text-primary" @click="editarFuncao(null, a.id)"><PhPlus /> Nova função</Button>
        </li>
      </ul>
    </article>

    <AreaFormDialog v-model="modalArea" :area="areaEditando" />
    <FuncaoFormDialog v-model="modalFuncao" :funcao="funcaoEditando" :area-id="areaDaNovaFuncao" />
  </section>
</template>
