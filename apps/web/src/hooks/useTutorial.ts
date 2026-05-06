import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useTutorial() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (!mounted) return;
      api.get('/tenants/me').then(res => {
        if (res.data?.tenant?.tutorial_concluido === false) {
          setShowWelcome(true);
        }
      }).catch(err => console.error('Erro ao buscar status do tutorial', err));
    }, 800);
    return () => { mounted = false; };
  }, []);

  const markAsCompleted = async () => {
    setShowWelcome(false);
    try {
      await api.patch('/tenants/tutorial-concluido');
    } catch (err) {
      console.error('Erro ao marcar tutorial como concluido', err);
    }
  };

  const startTour = () => {
    setShowWelcome(false);
    
    // Injeta CSS customizado para o tema escuro do driver.js, caso não exista
    if (!document.getElementById('driverjs-custom-theme')) {
      const style = document.createElement('style');
      style.id = 'driverjs-custom-theme';
      style.innerHTML = `
        .driver-popover.driverjs-theme {
          background-color: #1e293b;
          color: #f8fafc;
          border-radius: 12px;
          border: 1px solid #334155;
        }
        .driver-popover.driverjs-theme .driver-popover-title {
          font-size: 1.125rem;
          font-weight: bold;
          color: #fff;
          margin-bottom: 8px;
        }
        .driver-popover.driverjs-theme .driver-popover-description {
          font-size: 0.875rem;
          color: #cbd5e1;
          line-height: 1.5;
        }
        .driver-popover.driverjs-theme .driver-popover-footer {
          margin-top: 16px;
        }
        .driver-popover.driverjs-theme .driver-popover-progress-text {
          color: #94a3b8;
          font-size: 0.75rem;
        }
        .driver-popover.driverjs-theme .driver-popover-next-btn, 
        .driver-popover.driverjs-theme .driver-popover-done-btn {
          background-color: #00C875;
          color: white;
          text-shadow: none;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-weight: 600;
        }
        .driver-popover.driverjs-theme .driver-popover-prev-btn {
          background-color: #334155;
          color: white;
          text-shadow: none;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
        }
        .driver-popover.driverjs-theme .driver-popover-close-btn {
          color: #94a3b8;
        }
      `;
      document.head.appendChild(style);
    }

    const driverObj = driver({
      showProgress: true,
      progressText: 'Passo {{current}} de 6',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      popoverClass: 'driverjs-theme',
      allowClose: true,
      onDestroyStarted: () => {
        markAsCompleted();
        driverObj.destroy();
      },
      steps: [
        {
          element: '[data-tutorial="dashboard-title"]',
          popover: {
            title: 'Sua central de comando',
            description: 'Aqui você vê tudo de relance: faturamento do mês, quantos carros estão no pátio, clientes ativos e O.S. em atraso. É a primeira tela que você vê ao entrar.',
          }
        },
        {
          element: '[data-tutorial="dashboard-actions"]',
          popover: {
            title: 'Ações rápidas',
            description: 'Esses três botões são seus atalhos do dia a dia. Chegou um cliente? Clique em Nova O.S. Quer cadastrar alguém? Novo Cliente. Veio de indicação mas ainda não fechou? Novo Lead.',
          }
        },
        {
          element: '[data-tutorial="menu-os"]',
          popover: {
            title: 'Ordens de Serviço',
            description: 'Aqui ficam todos os atendimentos da sua oficina. Você abre uma O.S. para cada carro que entra, registra os serviços e peças, e fecha quando o trabalho estiver concluído. O financeiro é atualizado automaticamente.',
          }
        },
        {
          element: '[data-tutorial="menu-financeiro"]',
          popover: {
            title: 'Financeiro',
            description: 'Acompanhe quanto a oficina faturou, o que ainda está a receber e o fluxo de caixa. Tudo calculado automaticamente quando você fecha uma O.S. Sem planilha, sem trabalho manual.',
          }
        },
        {
          element: '[data-tutorial="menu-clientes"]',
          popover: {
            title: 'Base de Clientes',
            description: 'Todos os seus clientes ficam aqui com o histórico completo: quais carros têm, quantas vezes visitaram a oficina e quanto gastaram. O sistema avisa quando um cliente não volta há muito tempo.',
          }
        },
        {
          element: '[data-tutorial="menu-whatsapp"]',
          popover: {
            title: 'WhatsApp automático',
            description: 'O sistema avisa seus clientes pelo WhatsApp automaticamente: quando o carro fica pronto, quando está na hora de fazer revisão e envia pesquisa de satisfação após o atendimento. Tudo sem você precisar fazer nada.',
          }
        },
        {
          popover: {
            title: 'Pronto!',
            description: 'Você já conhece o AutoSync. Qualquer dúvida, explore o menu lateral. Bom trabalho!',
            doneBtnText: 'Concluir'
          }
        }
      ]
    });

    driverObj.drive();
  };

  const skipTour = () => {
    markAsCompleted();
  };

  return { showWelcome, startTour, skipTour };
}
