import React, { useState, useEffect, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const STORAGE_KEY = "deepscan-imap:answers";

const MODULES = [
  {
    id: "financeiro",
    label: "Financeiro & Precificação",
    short: "Financeiro",
    questions: [
      "Sei exatamente minha margem de lucro por máquina/peça vendida",
      "Tenho controle mensal de fluxo de caixa (entradas x saídas)",
      "Meus preços são revisados com base em custo + margem, não só 'feeling' ou concorrência",
      "Sei qual % do faturamento vem de peças/consumíveis vs máquinas novas",
      "As finanças da empresa estão separadas das minhas finanças pessoais",
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Presença Digital",
    short: "Marketing",
    questions: [
      "Sei quantas pessoas viram minha marca (site + redes) no último mês",
      "Site e redes sociais têm a mesma identidade e os links entre eles funcionam",
      "Produzo conteúdo com regularidade planejada, não de forma aleatória",
      "Invisto em anúncios pagos (Meta/Google Ads) de forma consistente",
      "Tenho depoimentos e provas sociais visíveis para novos clientes",
    ],
  },
  {
    id: "vendas",
    label: "Vendas & Atendimento",
    short: "Vendas",
    questions: [
      "Tenho um processo definido do primeiro contato até o fechamento",
      "Faço follow-up sistemático com quem pediu orçamento e não comprou",
      "Meço a taxa de conversão de orçamentos em vendas",
      "Minha equipe responde rápido o suficiente para não perder cliente",
      "Ofereço parcelamento/financiamento para aumentar o ticket médio",
    ],
  },
  {
    id: "operacoes",
    label: "Operações & Produtividade",
    short: "Operações",
    questions: [
      "Produção e entrega têm prazos previsíveis e cumpridos",
      "Meço produtividade por colaborador ou por processo",
      "Não existem gargalos conhecidos travando entregas há meses",
      "Uso algum sistema (ERP/planilha) para controle de estoque de peças",
    ],
  },
  {
    id: "portfolio",
    label: "Portfólio & Recorrência",
    short: "Recorrência",
    questions: [
      "Sei quantos clientes ativos têm máquinas minhas em uso hoje",
      "Existe rotina de recontato para venda de peças/consumíveis (recompra)",
      "Tenho programa de manutenção/pós-venda pago",
      "Identifico oportunidades de upsell na base de clientes atual",
    ],
  },
  {
    id: "gestao",
    label: "Gestão & Processos",
    short: "Gestão",
    questions: [
      "Existem processos documentados que não dependem só da minha memória",
      "Tenho indicadores (KPIs) que acompanho semanal ou mensalmente",
      "Existe um plano de metas claro para os próximos 90 dias",
      "Consigo delegar decisões operacionais, nem tudo passa por mim",
    ],
  },
];

const ACTIONS = {
  financeiro: {
    curto: [
      "Levantar o custo real de cada produto/serviço e definir margem mínima aceitável",
      "Implementar planilha simples de fluxo de caixa semanal (entrada x saída)",
      "Separar conta bancária da empresa da conta pessoal, se ainda não estiver separada",
    ],
    medio: [
      "Criar tabela de precificação por categoria (máquinas x peças x serviços) com margens definidas",
      "Implementar relatório mensal de DRE simplificado para acompanhar lucratividade real",
    ],
  },
  marketing: {
    curto: [
      "Corrigir inconsistências de link/identidade entre site e redes sociais",
      "Publicar prova social (depoimentos de clientes) no site e no Instagram",
      "Definir calendário mínimo de postagens (ex: 3x/semana) com temas fixos",
    ],
    medio: [
      "Estruturar campanha de anúncios pagos segmentada por tipo de cliente (indústria, comércio, hospitalar)",
      "Criar conteúdo educativo em vídeo/blog (\"como escolher a seladora certa\") para gerar tráfego orgânico",
    ],
  },
  vendas: {
    curto: [
      "Criar checklist do processo de venda: do primeiro contato ao fechamento",
      "Implementar follow-up obrigatório em até 48h para todo orçamento enviado",
      "Registrar taxa de conversão (orçamentos enviados x vendas fechadas) toda semana",
    ],
    medio: [
      "Oferecer parcelamento/financiamento formal para máquinas de ticket mais alto",
      "Treinar equipe de atendimento em tempo de resposta e argumentação de venda",
    ],
  },
  operacoes: {
    curto: [
      "Mapear os prazos reais de entrega dos últimos 3 meses e identificar atrasos recorrentes",
      "Identificar o principal gargalo de produção/entrega e atacar só esse primeiro",
    ],
    medio: [
      "Implementar sistema simples de controle de estoque de peças (planilha ou ERP leve)",
      "Criar indicador de produtividade por processo para acompanhar evolução",
    ],
  },
  portfolio: {
    curto: [
      "Levantar lista de clientes ativos com máquinas em uso (base instalada)",
      "Disparar uma campanha simples de recontato oferecendo peças/consumíveis para essa base",
    ],
    medio: [
      "Estruturar programa de manutenção/pós-venda recorrente (receita previsível)",
      "Criar rotina trimestral de upsell (ex: sugestão de upgrade de máquina) para clientes antigos",
    ],
  },
  gestao: {
    curto: [
      "Definir 3 a 5 KPIs simples para acompanhar semanalmente (faturamento, conversão, prazo de entrega)",
      "Documentar por escrito os 3 processos mais críticos da operação",
    ],
    medio: [
      "Criar rotina de reunião mensal de resultados com metas revisadas",
      "Delegar formalmente uma decisão operacional por trimestre para reduzir dependência do dono",
    ],
  },
};

const HEALTH_BANDS = [
  { max: 40, label: "Fundação frágil", desc: "Foco total em estabilizar a base antes de qualquer expansão.", color: "#C9553A" },
  { max: 65, label: "Operação funcional, com vazamentos de lucro", desc: "O negócio roda, mas perde dinheiro em pontos identificáveis.", color: "#D69A3B" },
  { max: 85, label: "Negócio saudável", desc: "Pronto para expansão estruturada nos próximos meses.", color: "#5B9E8F" },
  { max: 101, label: "Alta performance", desc: "Fundamentos sólidos — o foco agora é escala.", color: "#3E8E7E" },
];

function getHealthBand(score) {
  return HEALTH_BANDS.find((b) => score <= b.max);
}

function loadAnswers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveAnswers(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

function clearAnswers() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

function Gauge({ value, size = 96, label, color = "#D69A3B" }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const sweep = 270;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const angle = startAngle + sweep * pct;

  function polar(cx, cy, r, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  function arcPath(startA, endA) {
    const s = polar(cx, cy, r, startA);
    const e = polar(cx, cy, r, endA);
    const largeArc = endA - startA <= 180 ? 0 : 1;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size}>
        <path d={arcPath(startAngle, startAngle + sweep)} stroke="#33383D" strokeWidth={stroke} fill="none" strokeLinecap="round" />
        <path d={arcPath(startAngle, angle)} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize={size * 0.24} fill="#F2F0EA" fontWeight="600">
          {Math.round(value)}
        </text>
        <text x={cx} y={cy + size * 0.16} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize={size * 0.09} fill="#8B9196">
          /100
        </text>
      </svg>
      {label && (
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#C7CBCE", textAlign: "center", maxWidth: size + 20 }}>
          {label}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState("intro");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [answers, setAnswers] = useState(() => loadAnswers());
  const [saveState, setSaveState] = useState("idle");

  function setAnswer(moduleId, qIndex, value) {
    const next = {
      ...answers,
      [moduleId]: { ...(answers[moduleId] || {}), [qIndex]: value },
    };
    setAnswers(next);
    const ok = saveAnswers(next);
    setSaveState(ok ? "saved" : "error");
  }

  function resetAll() {
    setAnswers({});
    setModuleIndex(0);
    setStage("intro");
    clearAnswers();
  }

  const moduleScores = useMemo(() => {
    return MODULES.map((m) => {
      const modAnswers = answers[m.id] || {};
      const vals = m.questions.map((_, i) => modAnswers[i]).filter((v) => typeof v === "number");
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const answeredAll = vals.length === m.questions.length;
      return { ...m, score: avg * 10, answeredAll, answeredCount: vals.length };
    });
  }, [answers]);

  const overallScore = useMemo(() => {
    if (!moduleScores.length) return 0;
    return moduleScores.reduce((a, m) => a + m.score, 0) / moduleScores.length;
  }, [moduleScores]);

  const allAnswered = moduleScores.every((m) => m.answeredAll);
  const sortedAsc = useMemo(() => [...moduleScores].sort((a, b) => a.score - b.score), [moduleScores]);
  const priorityShortTerm = sortedAsc.slice(0, 3);
  const priorityMediumTerm = [...sortedAsc].sort((a, b) => a.score - b.score).slice(0, 4);
  const band = getHealthBand(overallScore);
  const radarData = moduleScores.map((m) => ({ subject: m.short, value: Math.round(m.score), fullMark: 100 }));

  const fontImport = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
    `}</style>
  );

  const baseStyle = {
    minHeight: "100vh",
    background: "#1C1F22",
    color: "#F2F0EA",
    fontFamily: "'IBM Plex Sans', sans-serif",
    padding: "0 0 60px 0",
  };

  return (
    <div style={baseStyle}>
      {fontImport}
      <Header saveState={saveState} onReset={resetAll} stage={stage} />
      {stage === "intro" && <Intro onStart={() => setStage("survey")} hasProgress={Object.keys(answers).length > 0} />}
      {stage === "survey" && (
        <Survey moduleIndex={moduleIndex} setModuleIndex={setModuleIndex} answers={answers} setAnswer={setAnswer} onFinish={() => setStage("results")} />
      )}
      {stage === "results" && (
        <Results
          moduleScores={moduleScores}
          overallScore={overallScore}
          band={band}
          radarData={radarData}
          priorityShortTerm={priorityShortTerm}
          priorityMediumTerm={priorityMediumTerm}
          allAnswered={allAnswered}
          onBackToSurvey={() => setStage("survey")}
        />
      )}
    </div>
  );
}

function Header({ saveState, onReset, stage }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #2C3034" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: -0.3 }}>DEEPSCAN</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#D69A3B", letterSpacing: 1 }}>IMAP SELADORAS · DIAGNÓSTICO</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6B7075" }}>
          {saveState === "saved" ? "salvo neste aparelho" : saveState === "error" ? "erro ao salvar" : ""}
        </span>
        {stage !== "intro" && (
          <button onClick={onReset} style={{ background: "transparent", border: "1px solid #3A3F44", color: "#8B9196", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}>
            reiniciar
          </button>
        )}
      </div>
    </div>
  );
}

function Intro({ onStart, hasProgress }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 28px 0" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#D69A3B", letterSpacing: 2, marginBottom: 14 }}>
        DIAGNÓSTICO EMPRESARIAL · 6 MÓDULOS
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, lineHeight: 1.15, margin: "0 0 20px", fontWeight: 700 }}>
        Um raio-x da operação, antes de decidir para onde crescer.
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: "#C7CBCE", margin: "0 0 32px" }}>
        Responda 27 perguntas objetivas sobre financeiro, marketing, vendas, operações,
        recorrência e gestão. No final você recebe um painel com a nota real de cada área
        da empresa, um plano de ação de <strong>90 dias</strong> para estancar perdas de lucro
        e uma rota de <strong>12 a 16 meses</strong> para expansão.
      </p>
      <div style={{ display: "flex", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
        {["Financeiro", "Marketing", "Vendas", "Operações", "Recorrência", "Gestão"].map((m) => (
          <div key={m} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B9196", border: "1px solid #2C3034", borderRadius: 4, padding: "6px 10px" }}>
            {m}
          </div>
        ))}
      </div>
      <button onClick={onStart} style={{ background: "#D69A3B", color: "#1C1F22", border: "none", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, padding: "14px 28px", borderRadius: 6, cursor: "pointer" }}>
        {hasProgress ? "Continuar diagnóstico" : "Iniciar diagnóstico"}
      </button>
    </div>
  );
}

function Survey({ moduleIndex, setModuleIndex, answers, setAnswer, onFinish }) {
  const mod = MODULES[moduleIndex];
  const modAnswers = answers[mod.id] || {};
  const answeredCount = mod.questions.filter((_, i) => typeof modAnswers[i] === "number").length;
  const isLast = moduleIndex === MODULES.length - 1;
  const canAdvance = answeredCount === mod.questions.length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 28px 0" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {MODULES.map((m, i) => (
          <div key={m.id} style={{ flex: 1, height: 4, borderRadius: 2, background: i < moduleIndex ? "#5B9E8F" : i === moduleIndex ? "#D69A3B" : "#2C3034" }} />
        ))}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#D69A3B", letterSpacing: 1, marginBottom: 8 }}>
        MÓDULO {moduleIndex + 1} DE {MODULES.length}
      </div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, margin: "0 0 28px", fontWeight: 600 }}>{mod.label}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {mod.questions.map((q, qi) => (
          <QuestionSlider key={qi} question={q} value={modAnswers[qi]} onChange={(v) => setAnswer(mod.id, qi, v)} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 44, paddingBottom: 20 }}>
        <button onClick={() => setModuleIndex((i) => Math.max(0, i - 1))} disabled={moduleIndex === 0} style={{ background: "transparent", border: "1px solid #3A3F44", color: moduleIndex === 0 ? "#4A4F54" : "#C7CBCE", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, padding: "12px 20px", borderRadius: 6, cursor: moduleIndex === 0 ? "default" : "pointer" }}>
          Voltar
        </button>
        <button onClick={() => { if (isLast) onFinish(); else setModuleIndex((i) => i + 1); }} disabled={!canAdvance} style={{ background: canAdvance ? "#D69A3B" : "#3A3F44", color: canAdvance ? "#1C1F22" : "#6B7075", border: "none", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, padding: "12px 24px", borderRadius: 6, cursor: canAdvance ? "pointer" : "default" }}>
          {isLast ? "Ver diagnóstico" : "Próximo módulo"}
        </button>
      </div>
    </div>
  );
}

function QuestionSlider({ question, value, onChange }) {
  const hasValue = typeof value === "number";
  return (
    <div>
      <div style={{ fontSize: 15, lineHeight: 1.5, color: "#F2F0EA", marginBottom: 14 }}>{question}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6B7075", width: 70 }}>discordo</span>
        <input type="range" min={0} max={10} step={1} value={hasValue ? value : 5} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: "#D69A3B", opacity: hasValue ? 1 : 0.5 }} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6B7075", width: 70, textAlign: "right" }}>concordo</span>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: hasValue ? "#D69A3B" : "#4A4F54", width: 24, textAlign: "center" }}>
          {hasValue ? value : "–"}
        </div>
      </div>
    </div>
  );
}

function Results({ moduleScores, overallScore, band, radarData, priorityShortTerm, priorityMediumTerm, allAnswered, onBackToSurvey }) {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 28px 0" }}>
      {!allAnswered && (
        <div style={{ background: "#2C2416", border: "1px solid #4A3A1C", color: "#D69A3B", fontSize: 13, padding: "12px 16px", borderRadius: 6, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Ainda faltam respostas em alguns módulos — o diagnóstico abaixo é parcial.</span>
          <button onClick={onBackToSurvey} style={{ background: "transparent", border: "1px solid #D69A3B", color: "#D69A3B", borderRadius: 4, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
            completar
          </button>
        </div>
      )}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#D69A3B", letterSpacing: 2, marginBottom: 10 }}>RESULTADO DO DIAGNÓSTICO</div>
      <div style={{ display: "flex", gap: 36, flexWrap: "wrap", alignItems: "center", marginBottom: 44 }}>
        <Gauge value={overallScore} size={140} color={band.color} />
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, margin: "0 0 6px", color: band.color, fontWeight: 700 }}>{band.label}</h2>
          <p style={{ fontSize: 15, color: "#C7CBCE", margin: 0, maxWidth: 440, lineHeight: 1.6 }}>{band.desc}</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 56, alignItems: "center" }}>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#2C3034" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#C7CBCE", fontSize: 12, fontFamily: "IBM Plex Sans" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#D69A3B" fill="#D69A3B" fillOpacity={0.28} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          {moduleScores.map((m) => (
            <Gauge key={m.id} value={m.score} size={92} label={m.short} color={m.score < 50 ? "#C9553A" : m.score < 75 ? "#D69A3B" : "#5B9E8F"} />
          ))}
        </div>
      </div>
      <PlanSection title="Plano de 90 dias — estancar a perda de lucro" eyebrow="CURTO PRAZO" color="#C9553A" items={priorityShortTerm} actionKey="curto" />
      <PlanSection title="Rota de 12 a 16 meses — expansão" eyebrow="MÉDIO PRAZO" color="#5B9E8F" items={priorityMediumTerm} actionKey="medio" />
    </div>
  );
}

function PlanSection({ title, eyebrow, color, items, actionKey }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color, letterSpacing: 2, marginBottom: 8 }}>{eyebrow}</div>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, margin: "0 0 24px", fontWeight: 600 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((m) => (
          <div key={m.id} style={{ border: "1px solid #2C3034", borderRadius: 8, padding: "18px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16 }}>{m.label}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8B9196" }}>nota {Math.round(m.score)}/100</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#C7CBCE", fontSize: 14, lineHeight: 1.9 }}>
              {(ACTIONS[m.id] && ACTIONS[m.id][actionKey] ? ACTIONS[m.id][actionKey] : []).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
