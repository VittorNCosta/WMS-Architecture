import { randomUUID } from 'node:crypto';
import { textoObrigatorio, textoOpcional } from '../validacao';

/** Produto controlado pelo armazém (cadastro / atualização / consulta). */
export class Produto {
  constructor(
    public readonly id: string,
    public sku: string,
    public nome: string,
    public descricao: string | null,
    public unidadeMedida: string,
    public ativo: boolean,
    public readonly criadoEm: Date,
    public atualizadoEm: Date,
  ) {}

  static criar(props: {
    sku: unknown;
    nome: unknown;
    descricao?: unknown;
    unidadeMedida: unknown;
  }): Produto {
    const agora = new Date();
    return new Produto(
      randomUUID(),
      textoObrigatorio(props.sku, 'SKU do produto'),
      textoObrigatorio(props.nome, 'Nome do produto'),
      textoOpcional(props.descricao),
      textoObrigatorio(props.unidadeMedida, 'Unidade de medida'),
      true,
      agora,
      agora,
    );
  }

  atualizar(dados: {
    nome?: unknown;
    descricao?: unknown;
    unidadeMedida?: unknown;
    ativo?: unknown;
  }): void {
    if (dados.nome !== undefined) this.nome = textoObrigatorio(dados.nome, 'Nome do produto');
    if (dados.descricao !== undefined) this.descricao = textoOpcional(dados.descricao);
    if (dados.unidadeMedida !== undefined) {
      this.unidadeMedida = textoObrigatorio(dados.unidadeMedida, 'Unidade de medida');
    }
    if (typeof dados.ativo === 'boolean') this.ativo = dados.ativo;
    this.atualizadoEm = new Date();
  }
}
