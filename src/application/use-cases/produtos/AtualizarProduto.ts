import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { ProdutoDTO, toProdutoDTO } from '../../dtos/ProdutoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface AtualizarProdutoInput {
  nome?: unknown;
  descricao?: unknown;
  unidadeMedida?: unknown;
  ativo?: unknown;
}

/** Caso de uso: atualizar dados de um produto existente. */
export class AtualizarProduto {
  constructor(
    private readonly produtos: IProdutoRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(id: string, dados: AtualizarProdutoInput, actor: Actor): Promise<ProdutoDTO> {
    const produto = await EntityFinder.findOrThrow(
      (pid) => this.produtos.buscarPorId(pid),
      id,
      'Produto',
    );

    produto.atualizar(dados);
    await this.produtos.atualizar(produto);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.UPDATE,
      entityType: 'Produto',
      entityId: produto.id,
      summary: `Produto "${produto.sku}" atualizado.`,
    });

    return toProdutoDTO(produto);
  }
}
