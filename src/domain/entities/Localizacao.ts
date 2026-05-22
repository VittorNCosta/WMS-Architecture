import { randomUUID } from 'node:crypto';
import { textoObrigatorio, textoOpcional } from '../validacao';

/** Endereço de armazenagem dentro do armazém (ex.: "A-01-02", "DOCA"). */
export class Localizacao {
  constructor(
    public readonly id: string,
    public codigo: string,
    public descricao: string | null,
    public ativo: boolean,
  ) {}

  static criar(props: { codigo: unknown; descricao?: unknown }): Localizacao {
    return new Localizacao(
      randomUUID(),
      textoObrigatorio(props.codigo, 'Código da localização'),
      textoOpcional(props.descricao),
      true,
    );
  }

  atualizar(dados: { codigo?: unknown; descricao?: unknown }): void {
    if (dados.codigo !== undefined) {
      this.codigo = textoObrigatorio(dados.codigo, 'Código da localização');
    }
    if (dados.descricao !== undefined) {
      this.descricao = textoOpcional(dados.descricao);
    }
  }

  ativar(): void {
    this.ativo = true;
  }

  inativar(): void {
    this.ativo = false;
  }
}
