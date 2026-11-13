import { describe, expect, it } from 'vitest'
import type { EscalaDetalhada, FuncaoDoDia, Inscricao } from './Escala'
import { linhasDaFuncao, textoWhatsApp } from './Exportacao'

const insc = (nome: string, papel: Inscricao['papel']): Inscricao => ({
  id: nome,
  profileId: nome,
  nome,
  papel,
  criadoEm: '',
})

const cozinha = { id: 'c', nome: 'Cozinha & Alimentos', cor: '#80b918', ordem: 1 }
const zeladoria = { id: 'z', nome: 'Banheiros & Zeladoria', cor: '#dddf00', ordem: 2 }

const funcao = (p: Partial<FuncaoDoDia>): FuncaoDoDia => ({
  id: p.nome ?? 'f',
  diaId: 'd',
  area: cozinha,
  funcaoModeloId: null,
  nome: 'Jantar',
  ordem: 1,
  vagasResp: 1,
  vagasAux: 2,
  ativa: true,
  inscricoes: [],
  ...p,
})

describe('linhas da função (planilha)', () => {
  it('responsáveis primeiro, vagas vazias em branco, numeradas', () => {
    const f = funcao({ inscricoes: [insc('Ana', 'auxiliar'), insc('Cris', 'responsavel')] })
    expect(linhasDaFuncao(f)).toEqual([
      { numero: 1, papel: 'responsavel', nome: 'Cris' },
      { numero: 2, papel: 'auxiliar', nome: 'Ana' },
      { numero: 3, papel: 'auxiliar', nome: null },
    ])
  })

  it('não esconde inscritos além das vagas', () => {
    const f = funcao({ vagasAux: 1, inscricoes: [insc('A', 'auxiliar'), insc('B', 'auxiliar')] })
    expect(linhasDaFuncao(f).map((l) => l.nome)).toEqual([null, 'A', 'B'])
  })
})

describe('texto para WhatsApp', () => {
  const escala: EscalaDetalhada = {
    id: 'e',
    titulo: 'Escala do Preparo – Nov 2026',
    descricao: null,
    dataInicio: '2026-11-20',
    dataFim: '2026-11-21',
    status: 'aberta',
    dias: [
      {
        id: 'd1',
        data: '2026-11-20',
        observacoes: 'Chegar às 7h',
        funcoes: [
          funcao({ nome: 'Jantar', ordem: 2, inscricoes: [insc('Cris', 'responsavel'), insc('Ana', 'auxiliar')] }),
          funcao({ nome: 'Café da Manhã', ordem: 1, ativa: false }),
          funcao({ nome: 'Templo', area: zeladoria, vagasResp: 1, vagasAux: 0, inscricoes: [insc('Bia', 'responsavel')] }),
        ],
      },
      { id: 'd2', data: '2026-11-21', observacoes: '', funcoes: [funcao({ nome: 'Almoço' })] },
    ],
  }

  it('monta o resumo por dia e área, só com funções ativas', () => {
    const t = textoWhatsApp(escala, { orgas: 'Cons. Isis', diaIds: ['d1'], link: 'https://app/escalas/e' })
    expect(t).toBe(
      [
        '*Escala do Preparo – Nov 2026*',
        '20/11 a 21/11/2026',
        'Orgã: Cons. Isis',
        '',
        '*Sexta-feira | 20 Nov*',
        '_Cozinha & Alimentos_',
        '• Jantar: ★ Cris, Ana (falta 1)',
        '_Banheiros & Zeladoria_',
        '• Templo: ★ Bia ✅',
        '📝 Chegar às 7h',
        '',
        'Escolha suas funções: https://app/escalas/e',
      ].join('\n'),
    )
  })

  it('função vazia e todos os dias por padrão', () => {
    const t = textoWhatsApp(escala)
    expect(t).toContain('*Sábado | 21 Nov*')
    expect(t).toContain('• Almoço: _ninguém ainda_ (faltam 3)')
  })
})
