import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { hojeISO } from '@/shared/lib/datas'
import { criarUseCasesMembros } from '../../application/use-cases'
import { situacao, type Mandato } from '../../domain/Mandato'
import { contarPorGrupo, type Socio } from '../../domain/Socio'
import { supabaseMembersRepository } from '../../infrastructure/SupabaseMembersRepository'

const membros = criarUseCasesMembros(supabaseMembersRepository)

export const useMembersStore = defineStore('members', () => {
  const socios = ref<Socio[]>([])
  const mandatos = ref<Mandato[]>([])
  const carregandoSocios = ref(false)
  const carregandoMandatos = ref(false)
  const erro = ref('')

  const contagem = computed(() => contarPorGrupo(socios.value))
  const aprovados = computed(() =>
    socios.value
      .filter((s) => s.status === 'aprovado')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  )
  /** profile_ids com mandato de Orgã vigente hoje */
  const orgasVigentes = computed(() => {
    const hoje = hojeISO()
    return new Set(mandatos.value.filter((m) => situacao(m, hoje) === 'vigente').map((m) => m.profileId))
  })

  async function carregarSocios() {
    carregandoSocios.value = true
    const r = await membros.listarSocios()
    carregandoSocios.value = false
    if (r.ok) socios.value = r.value
    else erro.value = r.error
  }

  async function carregarMandatos() {
    carregandoMandatos.value = true
    const r = await membros.listarMandatos()
    carregandoMandatos.value = false
    if (r.ok) mandatos.value = r.value
    else erro.value = r.error
  }

  return {
    socios,
    mandatos,
    carregandoSocios,
    carregandoMandatos,
    erro,
    contagem,
    aprovados,
    orgasVigentes,
    carregarSocios,
    carregarMandatos,
  }
})
