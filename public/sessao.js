/**
 * Guarda de sessão compartilhada do WMS (JS vanilla, sem módulos).
 *
 * A autenticação é feita na tela de login (login.html), que grava os dados
 * públicos do usuário em sessionStorage sob a chave "wms_usuario". As demais
 * telas protegidas chamam exigirSessao() no início do script da página.
 */
(function () {
  'use strict';

  var CHAVE_SESSAO = 'wms_usuario';

  /**
   * Lê a sessão atual. Se não houver usuário autenticado, redireciona para o
   * login ("/") e retorna null (o chamador deve abortar a renderização).
   * @returns {{id:string,nome:string,login:string,perfil:string}|null}
   */
  function exigirSessao() {
    var bruto = null;
    try {
      bruto = sessionStorage.getItem(CHAVE_SESSAO);
    } catch (e) {
      bruto = null;
    }

    if (!bruto) {
      window.location.href = '/';
      return null;
    }

    try {
      var usuario = JSON.parse(bruto);
      if (!usuario || typeof usuario !== 'object' || !usuario.id) {
        sessionStorage.removeItem(CHAVE_SESSAO);
        window.location.href = '/';
        return null;
      }
      return usuario;
    } catch (e) {
      try {
        sessionStorage.removeItem(CHAVE_SESSAO);
      } catch (e2) {
        /* sessionStorage indisponível — segue para o redirect mesmo assim. */
      }
      window.location.href = '/';
      return null;
    }
  }

  /** Encerra a sessão: limpa o storage e volta ao login. */
  function sair() {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch (e) {
      /* Ignora: mesmo sem conseguir limpar, o redirect abaixo protege o acesso. */
    }
    window.location.href = '/';
  }

  window.exigirSessao = exigirSessao;
  window.sair = sair;
})();
