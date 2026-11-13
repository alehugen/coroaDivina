import { describe, expect, it } from 'vitest'
import { validarCadastro } from './Cadastro'
import { isAdmin, isGestor, type Conta } from './Conta'
import { criarEmail } from './Email'
import { criarTelefone, formatarTelefone } from './Telefone'

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

describe('permissões', () => {
  const conta: Conta = {
    id: '1',
    nome: 'A',
    email: 'a@a.com',
    telefone: '',
    role: 'socio',
    status: 'aprovado',
    isOrga: false,
  }
  it('sócio comum não é gestor', () => expect(isGestor(conta)).toBe(false))
  it('Orgã vigente é gestor, mas não admin', () => {
    expect(isGestor({ ...conta, isOrga: true })).toBe(true)
    expect(isAdmin({ ...conta, isOrga: true })).toBe(false)
  })
  it('admin pendente não tem poderes', () => {
    expect(isAdmin({ ...conta, role: 'admin', status: 'pendente' })).toBe(false)
  })
})
