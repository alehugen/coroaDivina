import { describe, expect, it } from 'vitest'
import { validarCadastro, validarPerfil } from './Cadastro'
import { isAdmin, isGestor, podeEditarAgenda, type Conta } from './Conta'
import { criarEmail } from './Email'
import { criarTelefone, formatarTelefone, mascararTelefone } from './Telefone'

describe('Email', () => {
  it('normaliza e valida', () => {
    expect(criarEmail('  Fulano@Email.COM ')).toEqual({ ok: true, value: 'fulano@email.com' })
    expect(criarEmail('invalido').ok).toBe(false)
    expect(criarEmail('').ok).toBe(false)
  })
})

describe('Telefone', () => {
  it('aceita formatos comuns e guarda só dígitos', () => {
    expect(criarTelefone('(11) 98765-4321')).toEqual({ ok: true, value: '11987654321' })
    expect(criarTelefone('+55 11 98765-4321')).toEqual({ ok: true, value: '11987654321' })
    expect(criarTelefone('1133334444')).toEqual({ ok: true, value: '1133334444' })
  })
  it('rejeita tamanhos inválidos', () => {
    expect(criarTelefone('98765-4321').ok).toBe(false)
  })
  it('formata', () => {
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321')
  })
  it('aplica máscara progressiva enquanto digita', () => {
    const passos = ['4', '41', '419', '4198', '41988177', '419881770', '4198817709', '41988177093']
    expect(passos.map(mascararTelefone)).toEqual([
      '(4',
      '(41',
      '(41) 9',
      '(41) 98',
      '(41) 9881-77',
      '(41) 9881-770',
      '(41) 9881-7709',
      '(41) 98817-7093',
    ])
  })
  it('máscara aceita colar com DDI e limita a 11 dígitos', () => {
    expect(mascararTelefone('+55 41 98817-7093')).toBe('(41) 98817-7093')
    expect(mascararTelefone('419881770939999')).toBe('(41) 98817-7093')
    expect(mascararTelefone('(41')).toBe('(41')
    expect(mascararTelefone('')).toBe('')
  })
})

describe('validarCadastro', () => {
  const base = {
    nome: ' Maria  da Silva ',
    email: 'maria@x.com',
    telefone: '61 99999-0000',
    senha: '12345678',
    confirmacaoSenha: '12345678',
  }
  it('aceita dados válidos e normaliza o nome', () => {
    const r = validarCadastro(base)
    expect(r.ok && r.value.nome).toBe('Maria da Silva')
  })
  it('acusa senhas diferentes', () => {
    const r = validarCadastro({ ...base, confirmacaoSenha: 'outra123' })
    expect(!r.ok && r.error.confirmacaoSenha).toBeTruthy()
  })
})

describe('validarPerfil', () => {
  it('normaliza nome e telefone', () => {
    expect(validarPerfil({ nome: ' Ana  Maria ', telefone: '(41) 98817-7093' })).toEqual({
      ok: true,
      value: { nome: 'Ana Maria', telefone: '41988177093' },
    })
  })
  it('aponta erros por campo', () => {
    const r = validarPerfil({ nome: 'A', telefone: '123' })
    expect(!r.ok && Object.keys(r.error).sort()).toEqual(['nome', 'telefone'])
  })
})

describe('permissões', () => {
  const conta: Conta = {
    id: '1',
    nome: 'A',
    email: 'a@a.com',
    telefone: '',
    role: 'socio',
    status: 'aprovado',
    isOrga: false,
    receberLembretes: true,
    exclusaoSolicitadaEm: null,
    grau: 'QS',
  }
  it('sócio comum não é gestor', () => expect(isGestor(conta)).toBe(false))
  it('Orgã vigente CDC/QM é gestor, mas não admin', () => {
    expect(isGestor({ ...conta, isOrga: true, grau: 'CDC' })).toBe(true)
    expect(isGestor({ ...conta, isOrga: true, grau: 'QM' })).toBe(true)
    expect(isAdmin({ ...conta, isOrga: true, grau: 'QM' })).toBe(false)
  })
  it('Orgã com grau abaixo de CDC não gerencia escalas', () => {
    expect(isGestor({ ...conta, isOrga: true, grau: 'QS' })).toBe(false)
    expect(isGestor({ ...conta, isOrga: true, grau: 'CI' })).toBe(false)
  })
  it('agenda e grau: admin ou QM', () => {
    expect(podeEditarAgenda(conta)).toBe(false)
    expect(podeEditarAgenda({ ...conta, grau: 'CDC', isOrga: true })).toBe(false)
    expect(podeEditarAgenda({ ...conta, grau: 'QM' })).toBe(true)
    expect(podeEditarAgenda({ ...conta, role: 'admin' })).toBe(true)
    expect(podeEditarAgenda({ ...conta, grau: 'QM', status: 'inativo' })).toBe(false)
  })
  it('admin inativo não tem poderes', () => {
    expect(isAdmin({ ...conta, role: 'admin', status: 'inativo' })).toBe(false)
  })
})
