import { supabase } from '@/shared/lib/supabase'
import type { CatalogRepository } from '../application/ports/CatalogRepository'
import type { Area, DadosFuncao, FuncaoModelo } from '../domain/Catalogo'

interface FuncaoRow {
  id: string
  area_id: string
  nome: string
  ordem: number
  vagas_resp_padrao: number
  vagas_aux_padrao: number
  ativo: boolean
}

const toFuncao = (r: FuncaoRow): FuncaoModelo => ({
  id: r.id,
  areaId: r.area_id,
  nome: r.nome,
  ordem: r.ordem,
  vagasResp: r.vagas_resp_padrao,
  vagasAux: r.vagas_aux_padrao,
  ativo: r.ativo,
})

function toFuncaoRow(d: Partial<DadosFuncao> & { ordem?: number }) {
  const row: Record<string, unknown> = {}
  if (d.areaId !== undefined) row.area_id = d.areaId
  if (d.nome !== undefined) row.nome = d.nome
  if (d.vagasResp !== undefined) row.vagas_resp_padrao = d.vagasResp
  if (d.vagasAux !== undefined) row.vagas_aux_padrao = d.vagasAux
  if (d.ativo !== undefined) row.ativo = d.ativo
  if (d.ordem !== undefined) row.ordem = d.ordem
  return row
}

async function exigir<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>) {
  const { data, error } = await p
  if (error) throw error
  if (!data?.length) throw new Error('SEM_PERMISSAO')
}

export const supabaseCatalogRepository: CatalogRepository = {
  async listarAreas() {
    const { data, error } = await supabase.from('areas').select('id, nome, cor, ordem').returns<Area[]>()
    if (error) throw error
    return data
  },

  async listarFuncoes() {
    const { data, error } = await supabase
      .from('funcao_modelos')
      .select('id, area_id, nome, ordem, vagas_resp_padrao, vagas_aux_padrao, ativo')
      .returns<FuncaoRow[]>()
    if (error) throw error
    return data.map(toFuncao)
  },

  criarArea: (d) => exigir(supabase.from('areas').insert(d).select('id')),
  atualizarArea: (id, d) => exigir(supabase.from('areas').update(d).eq('id', id).select('id')),
  removerArea: (id) => exigir(supabase.from('areas').delete().eq('id', id).select('id')),

  criarFuncao: (d) => exigir(supabase.from('funcao_modelos').insert(toFuncaoRow(d)).select('id')),
  atualizarFuncao: (id, d) =>
    exigir(supabase.from('funcao_modelos').update(toFuncaoRow(d)).eq('id', id).select('id')),
  removerFuncao: (id) => exigir(supabase.from('funcao_modelos').delete().eq('id', id).select('id')),

  async reordenar(tabela, ordens) {
    const nome = tabela === 'areas' ? 'areas' : 'funcao_modelos'
    await Promise.all(
      ordens.map((o) => exigir(supabase.from(nome).update({ ordem: o.ordem }).eq('id', o.id).select('id'))),
    )
  },
}
