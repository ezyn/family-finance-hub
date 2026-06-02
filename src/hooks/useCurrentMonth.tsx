import { useEffect, useState } from 'react';

const getMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Retorna a chave do mês atual (AAAA-MM) e atualiza automaticamente
 * quando o mês vira, forçando recálculos que dependem do mês corrente.
 */
export function useCurrentMonth() {
  const [monthKey, setMonthKey] = useState(getMonthKey);

  useEffect(() => {
    const check = () => setMonthKey(prev => {
      const k = getMonthKey();
      return prev !== k ? k : prev;
    });
    // Verifica periodicamente e ao voltar o foco para a aba
    const id = setInterval(check, 60 * 1000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return monthKey;
}
