import { supabase } from '@/shared/lib/supabase'
import type { EscalasRepository, PatchFuncaoDia } from '../application/ports/EscalasRepository'
import type {
  AreaRef,
  DiaEscala,
  Escala,
  EscalaDetalhada,
  Inscricao,
  Papel,
  StatusEscala,
} from '../domain/Escala'
import type { MinhaInscricao } from '../domain/Inscricao'

interface EscalaRow {
  id: string
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string
  status: StatusEscala
}

interface FuncaoRow {
  id: string
  dia_id: string
  funcao_modelo_id: string | null
  nome: string
  ordem: number
  vagas_resp: number
  vagas_aux: number
  ativa: boolean
  areas: AreaRef
}

interface DiaRow {
  id: string
  data: string
  observacoes: string | null
  dia_funcoes: FuncaoRow[]
}

interface InscricaoRow {
  id: string
  dia_funcao_id: string
  profile_id: string
  nome: string
  papel: Papel
  created_at: string
}

const COLS_ESCALA = 'id, titulo, descricao, data_inicio, data_fim, status'

const toEscala = (r: EscalaRow): Escala => ({
  id: r.id,
  titulo: r.titulo,
  descricao: r.descricao,
  dataInicio: r.data_inicio,
  dataFim: r.data_fim,
  status: r.status,
})

async function exigir<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>) {
  const { data, error } = await p
  if (error) throw error
  if (!data?.length) throw new Error('SEM_PERMISSAO')
}

export const supabaseEscalasRepository: EscalasRepository = {
  async listar() {
    const [escalas, resumos] = await Promise.all([
      supabase.from('escalas').select(COLS_ESCALA).order('data_inicio', { ascending: false }).returns<EscalaRow[]>(),
      supabase
        .from('v_escala_resumo')
        .select('escala_id, dias, vagas, ocupadas')
        .returns<{ escala_id: string; dias: number; vagas: number; ocupadas: number }[]>(),
    ])
    if (escalas.error) throw escalas.error
    if (resumos.error) throw resumos.error
    const porId = new Map(resumos.data.map((r) => [r.escala_id, r]))
    return escalas.data.map((r) => {
      const s = porId.get(r.id)
      return { ...toEscala(r), resumo: { dias: s?.dias ?? 0, vagas: s?.vagas ?? 0, ocupadas: s?.ocupadas ?? 0 } }
    })
  },

  async obter(id) {
    const [escala, inscricoes] = await Promise.all([
      supabase
        .from('escalas')
        .select(
          `${COLS_ESCALA}, escala_dias(id, data, observacoes, dia_funcoes(id, dia_id, funcao_modelo_id, nome, ordem, vagas_resp, vagas_aux, ativa, areas(id, nome, cor, ordem)))`,
        )
        .eq('id', id)
        .maybeSingle<EscalaRow & { escala_dias: DiaRow[] }>(),
      supabase
        .from('v_inscricoes')
        .select('id, dia_funcao_id, profile_id, nome, papel, created_at')
        .eq('escala_id', id)
        .order('created_at')
        .returns<InscricaoRow[]>(),
    ])
    if (escala.error) throw escala.error
    if (inscricoes.error) throw inscricoes.error
    if (!escala.data) return null

    const porFuncao = new Map<string, Inscricao[]>()
    for (const i of inscricoes.data) {
      const lista = porFuncao.get(i.dia_funcao_id) ?? []
      lista.push({ id: i.id, profileId: i.profile_id, nome: i.nome, papel: i.papel, criadoEm: i.created_at })
      porFuncao.set(i.dia_funcao_id, lista)
    }

    const dias: DiaEscala[] = escala.data.escala_dias
      .map((d) => ({
        id: d.id,
        data: d.data,
        observacoes: d.observacoes ?? '',
        funcoes: d.dia_funcoes.map((f) => ({
          id: f.id,
          diaId: f.dia_id,
          area: f.areas,
          funcaoModeloId: f.funcao_modelo_id,
          nome: f.nome,
          ordem: f.ordem,
          vagasResp: f.vagas_resp,
          vagasAux: f.vagas_aux,
          ativa: f.ativa,
          inscricoes: porFuncao.get(f.id) ?? [],
        })),
      }))
      .sort((a, b) => a.data.localeCompare(b.data))

    return { ...toEscala(escala.data), dias } satisfies EscalaDetalhada
  },

  async listarOrgas() {
    const { data, error } = await supabase
      .from('v_orgas')
      .select('nome, inicio, fim')
      .returns<{ nome: string; inicio: string; fim: string }[]>()
    if (error) throw error
    return data
  },

  async listarDias() {
    const { data, error } = await supabase
      .from('escala_dias')
      .select('escala_id, data')
      .returns<{ escala_id: string; data: string }[]>()
    if (error) throw error
    return data.map((r) => ({ escalaId: r.escala_id, data: r.data }))
  },

  async criar(d) {
    const { data, error } = await supabase.rpc('criar_escala', {
      p_titulo: d.titulo,
      p_descricao: d.descricao,
      p_datas: d.datas,
      p_funcao_modelo_ids: d.funcaoModeloIds,
    })
    if (error) throw error
    return data as string
  },

  async duplicar(origemId, titulo, novoInicio) {
    const { data, error } = await supabase.rpc('duplicar_escala', {
      p_origem_id: origemId,
      p_titulo: titulo,
      p_novo_inicio: novoInicio,
    })
    if (error) throw error
    return data as string
  },

  atualizar: (id, d) => exigir(supabase.from('escalas').update(d).eq('id', id).select('id')),
  alterarStatus: (id, status) => exigir(supabase.from('escalas').update({ status }).eq('id', id).select('id')),
  excluir: (id) => exigir(supabase.from('escalas').delete().eq('id', id).select('id')),

  async adicionarDia(escalaId, data, funcaoModeloIds) {
    const { error } = await supabase.rpc('adicionar_dia', {
      p_escala_id: escalaId,
      p_data: data,
      p_funcao_modelo_ids: funcaoModeloIds,
    })
    if (error) throw error
  },
  removerDia: (diaId) => exigir(supabase.from('escala_dias').delete().eq('id', diaId).select('id')),
  salvarObservacoes: (diaId, texto) =>
    exigir(supabase.from('escala_dias').update({ observacoes: texto || null }).eq('id', diaId).select('id')),

  adicionarFuncao: (diaId, d) =>
    exigir(
      supabase
        .from('dia_funcoes')
        .insert({
          dia_id: diaId,
          area_id: d.areaId,
          funcao_modelo_id: d.funcaoModeloId,
          nome: d.nome,
          ordem: d.ordem,
          vagas_resp: d.vagasResp,
          vagas_aux: d.vagasAux,
        })
        .select('id'),
    ),

  atualizarFuncao(id, p: PatchFuncaoDia) {
    const row: Record<string, unknown> = {}
    if (p.vagasResp !== undefined) row.vagas_resp = p.vagasResp
    if (p.vagasAux !== undefined) row.vagas_aux = p.vagasAux
    if (p.ativa !== undefined) row.ativa = p.ativa
    if (p.nome !== undefined) row.nome = p.nome
    return exigir(supabase.from('dia_funcoes').update(row).eq('id', id).select('id'))
  },
  removerFuncao: (id) => exigir(supabase.from('dia_funcoes').delete().eq('id', id).select('id')),

  async inscrever(diaFuncaoId, papel, profileId) {
    const { error } = await supabase.rpc('inscrever', {
      p_dia_funcao_id: diaFuncaoId,
      p_papel: papel,
      ...(profileId ? { p_profile_id: profileId } : {}),
    })
    if (error) throw error
  },

  async cancelarInscricao(inscricaoId) {
    const { error } = await supabase.rpc('cancelar_inscricao', { p_inscricao_id: inscricaoId })
    if (error) throw error
  },

  async minhasInscricoes() {
    const { data, error } = await supabase.rpc('minhas_inscricoes')
    if (error) throw error
    return ((data ?? []) as MinhaInscricaoRow[]).map(
      (r): MinhaInscricao => ({
        id: r.id,
        papel: r.papel,
        funcao: r.funcao,
        area: r.area,
        areaCor: r.area_cor,
        data: r.data,
        escalaId: r.escala_id,
        escala: r.escala,
        escalaStatus: r.escala_status,
      }),
    )
  },

  observarInscricoes(aoMudar) {
    const canal = supabase
      .channel(`inscricoes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inscricoes' }, () => aoMudar())
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  },
}

interface MinhaInscricaoRow {
  id: string
  papel: Papel
  funcao: string
  area: string
  area_cor: string
  data: string
  escala_id: string
  escala: string
  escala_status: StatusEscala
}
