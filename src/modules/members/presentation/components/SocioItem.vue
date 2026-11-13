<script setup lang="ts">
import {
  PhCheck,
  PhDotsThreeVertical,
  PhShieldCheck,
  PhShieldSlash,
  PhTrash,
  PhUserMinus,
  PhWhatsappLogo,
  PhX,
} from '@phosphor-icons/vue'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { formatarTelefone } from '@/modules/identity/domain/Telefone'
import { formatarData } from '@/shared/lib/datas'
import { UserAvatar } from '@/shared/ui'
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
const temMenu = computed(
  () => props.acoes.tornarAdmin || props.acoes.removerAdmin || props.acoes.desativar || props.acoes.excluir,
)
const temBotoes = computed(() => props.acoes.aprovar || props.acoes.recusarExclusao || props.acoes.reativar)
</script>

<template>
  <li class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <UserAvatar :nome="socio.nome" />
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-1.5 font-medium">
          <span class="truncate">{{ socio.nome }}</span>
          <span v-if="euMesmo" class="text-xs font-normal text-muted-foreground">(você)</span>
          <Badge v-if="socio.role === 'admin'">Admin</Badge>
          <Badge v-if="isOrga" class="bg-highlight text-highlight-foreground">Orgã</Badge>
          <Badge v-if="socio.status === 'rejeitado'" variant="destructive">Rejeitado</Badge>
          <Badge v-if="socio.status === 'inativo'" variant="secondary">Inativo</Badge>
        </p>
        <p class="truncate text-sm text-muted-foreground">{{ socio.email }}</p>
        <p class="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <a
            v-if="whatsapp"
            :href="whatsapp"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1 hover:text-primary hover:underline"
          >
            <PhWhatsappLogo class="size-4" />
            {{ formatarTelefone(socio.telefone) }}
          </a>
          <span v-else>Sem telefone</span>
          <span aria-hidden="true">·</span>
          <span>cadastro em {{ formatarData(socio.criadoEm) }}</span>
        </p>
        <p v-if="socio.exclusaoSolicitadaEm" class="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
          <PhTrash class="size-4" /> Pediu exclusão da conta em {{ formatarData(socio.exclusaoSolicitadaEm) }}
        </p>
      </div>
      <Spinner v-if="ocupado && !temBotoes" class="mt-2.5 shrink-0 text-primary" />
      <DropdownMenu v-if="temMenu">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon-lg" class="-mt-1 -mr-2 shrink-0" :disabled="ocupado" :aria-label="`Ações para ${socio.nome}`">
            <PhDotsThreeVertical class="size-5" weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem v-if="acoes.tornarAdmin" @select="emit('acao', 'tornarAdmin')">
            <PhShieldCheck /> Tornar admin
          </DropdownMenuItem>
          <DropdownMenuItem v-if="acoes.removerAdmin" @select="emit('acao', 'removerAdmin')">
            <PhShieldSlash /> Remover admin
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="(acoes.tornarAdmin || acoes.removerAdmin) && (acoes.desativar || acoes.excluir)" />
          <DropdownMenuItem v-if="acoes.desativar" variant="destructive" @select="emit('acao', 'desativar')">
            <PhUserMinus /> Desativar
          </DropdownMenuItem>
          <DropdownMenuItem v-if="acoes.excluir && !acoes.recusarExclusao" variant="destructive" @select="emit('acao', 'excluir')">
            <PhTrash /> Excluir permanentemente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- botões de decisão (só quando há algo a decidir) -->
    <div v-if="temBotoes" class="flex flex-wrap items-center gap-2 pl-13 sm:pl-0">
      <Spinner v-if="ocupado" class="text-primary" />
      <template v-if="acoes.aprovar">
        <Button size="lg" :disabled="ocupado" @click="emit('acao', 'aprovar')">
          <PhCheck /> Aprovar
        </Button>
        <Button size="lg" variant="outline" :disabled="ocupado" @click="emit('acao', 'rejeitar')">
          <PhX /> Rejeitar
        </Button>
      </template>
      <template v-if="acoes.recusarExclusao">
        <Button v-if="acoes.excluir" size="lg" variant="destructive" :disabled="ocupado" @click="emit('acao', 'excluir')">
          <PhTrash /> Aprovar exclusão
        </Button>
        <Button size="lg" variant="outline" :disabled="ocupado" @click="emit('acao', 'recusarExclusao')">
          <PhX /> Recusar
        </Button>
      </template>
      <Button v-if="acoes.reativar" size="lg" variant="outline" :disabled="ocupado" @click="emit('acao', 'reativar')">
        Reativar
      </Button>
    </div>
  </li>
</template>
