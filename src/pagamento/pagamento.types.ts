export type PagamentoAcao = 'CONFIRMAR' | 'RECUSAR';

export type PagamentoMensagem = {
  idPedido: string;
  userId: string;
  acao: PagamentoAcao;
};

export type PagamentoStatusResponse = {
  idPedido: string;
  total: number;
  pagamentoStatus: string;
};
