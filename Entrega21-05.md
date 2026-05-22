Arquitetura de Software | TP2 | Sprint 2
Evolução arquitetural com duas funcionalidades
1. Objetivo
A Sprint 2 tem como objetivo evoluir a implementação iniciada na Sprint 1. Cada grupo deve consolidar a base arquitetural do
projeto e entregar duas funcionalidades relevantes.
2. Regras da entrega
 Grupos sem correções obrigatórias devem implementar duas funcionalidades completas.
 Grupos com correções da Sprint 1 devem corrigir a entrega anterior antes de avançar.
 As duas funcionalidades devem atravessar a arquitetura escolhida.
 Cada funcionalidade deve ter entrada processamento regra de negócio acesso a dados e saída verificável.
 A regra de negócio não deve ficar concentrada na interface.
 O projeto deve executar com instruções claras.
 O README deve estar atualizado.
3. Requisito do README
O README deve conter uma seção chamada Descrição das implementações e fluxo arquitetural.
Nessa seção o grupo deve descrever as duas funcionalidades implementadas. Para cada funcionalidade deve informar:
 nome da funcionalidade
 onde o fluxo começa
 quais componentes participam
 onde fica a regra de negócio
 onde os dados são armazenados ou consultados
 como executar ou testar
 resultado esperado
Exemplo de fluxo: Controller -> Service -> Repository -> Persistência.