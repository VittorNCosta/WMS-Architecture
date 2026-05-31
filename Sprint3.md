TP2 - Sprint 3
Consolidação Arquitetural e Evolução do Sistema
Nesta sprint, a evolução funcional deve estar acompanhada de evolução arquitetural. O grupo
deve demonstrar coerência entre documento de engenharia, código-fonte, responsabilidades,
camadas e decisões de projeto.
1. Objetivo
Na Sprint 3, cada grupo deverá evoluir a implementação iniciada nas Sprints 1 e 2, consolidando a
arquitetura escolhida no documento de engenharia do projeto.
O foco desta sprint não é apenas adicionar novas funcionalidades, mas demonstrar que o sistema está cada
vez mais aderente às decisões arquiteturais assumidas pelo grupo, aos princípios discutidos em aula e aos
pontos de melhoria identificados durante a avaliação arquitetural da Sprint 2.
Cada equipe deve reler seu documento de engenharia e verificar se a implementação atual realmente
respeita os princípios, padrões, camadas, responsabilidades e atributos de qualidade definidos inicialmente.
2. Orientações Gerais
Cada grupo deverá:
1. Evoluir o sistema mantendo coerência com a arquitetura escolhida no documento de engenharia.
2. Corrigir ou melhorar pontos arquiteturais frágeis identificados nas entregas anteriores, especialmente
relacionados a:
• baixo acoplamento;
• alta coesão;
• separação clara de responsabilidades;
• localização correta das regras de negócio;
• uso adequado de interfaces, contratos, portas, serviços, casos de uso ou camadas;
• aderência aos padrões arquiteturais propostos;
• consistência entre documentação e código.
3. Implementar pelo menos duas novas funcionalidades relevantes do domínio do sistema.
4. A nova funcionalidade deve atravessar a arquitetura proposta pelo grupo, contendo:
• entrada verificável;
• processamento;
• regra de negócio;
• acesso ou manipulação de dados (pode ser mock, fake);
• saída observável;
• documentação do fluxo arquitetural.
5. Revisar funcionalidades já entregues nas Sprints 1 e 2, evitando que novas implementações aumentem
o acoplamento, dupliquem responsabilidades ou coloquem regra de negócio em camadas
inadequadas.
6. Atualizar a documentação do projeto, deixando claro:
• o que foi implementado na Sprint 3;
• quais pontos da arquitetura foram melhorados;
• qual fluxo arquitetural a nova funcionalidade percorre;
TP2 - Sprint 3 | Consolidação Arquitetural
Engenharia de Software - Arquitetura de Software
• quais componentes participam do fluxo;
• como executar e testar a funcionalidade;
• quais decisões arquiteturais foram mantidas ou ajustadas.
3. Relação com o Documento de Engenharia
A Sprint 3 será avaliada considerando a aderência da implementação ao documento de engenharia
produzido pelo grupo.
Portanto, cada equipe deve verificar se o código entregue está coerente com:
• a arquitetura escolhida;
• os módulos, camadas ou serviços previstos;
• os padrões de projeto mencionados;
• os atributos de qualidade declarados;
• as responsabilidades atribuídas a cada parte do sistema;
• os fluxos de negócio mais importantes do domínio.
4. Entregáveis
A entrega da Sprint 3 deverá conter:
1. Código-fonte atualizado.
2. Nova funcionalidade implementada e executável.
3. Melhorias arquiteturais aplicadas sobre o código existente.
4. README atualizado com uma seção chamada:
Descrição das implementações e evolução arquitetural - Sprint 3
5. Nessa seção, o grupo deve descrever:
• funcionalidade implementada;
• fluxo arquitetural;
• componentes envolvidos;
• regra de negócio implementada;
• mecanismo de persistência ou integração utilizado;
• exemplos de entrada e saída;
• melhorias arquiteturais realizadas em relação à Sprint 2.
6. Testes automatizados.
5. Critérios de Avaliação
A avaliação considerará:
• aderência à arquitetura definida no documento de engenharia;
• clareza na separação de responsabilidades;
• baixo acoplamento entre módulos, camadas ou serviços;
• alta coesão dos componentes;
• regras de negócio localizadas na camada adequada;
• uso consistente dos padrões arquiteturais propostos;
• completude da nova funcionalidade;
• evolução real em relação à Sprint 2;
TP2 - Sprint 3 | Consolidação Arquitetural
Engenharia de Software - Arquitetura de Software
6. Observação Importante
A Sprint 3 não deve ser tratada apenas como uma etapa de expansão funcional. O principal objetivo é
mostrar que o sistema está evoluindo de forma arquiteturalmente consciente.
Cada grupo deve demonstrar que compreende a própria arquitetura, sabe identificar fragilidades na
implementação atual e consegue evoluir o código respeitando os princípios discutidos ao longo da
disciplina.