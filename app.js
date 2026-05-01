const documentInput = document.querySelector("#documentInput");
const loadSampleButton = document.querySelector("#loadSampleButton");
const clearButton = document.querySelector("#clearButton");
const analyzeButton = document.querySelector("#analyzeButton");
const copyReplyButton = document.querySelector("#copyReplyButton");
const copyReportButton = document.querySelector("#copyReportButton");

const turnCountEl = document.querySelector("#turnCount");
const turnMixEl = document.querySelector("#turnMix");
const emotionScoreEl = document.querySelector("#emotionScore");
const emotionHintEl = document.querySelector("#emotionHint");
const serviceScoreEl = document.querySelector("#serviceScore");
const scoreHintEl = document.querySelector("#scoreHint");
const riskScoreEl = document.querySelector("#riskScore");
const riskHintEl = document.querySelector("#riskHint");
const summaryMetaEl = document.querySelector("#summaryMeta");
const summaryOutputEl = document.querySelector("#summaryOutput");
const sceneBadgeEl = document.querySelector("#sceneBadge");
const modeBadgeEl = document.querySelector("#modeBadge");
const tagCloudEl = document.querySelector("#tagCloud");
const signalBoardEl = document.querySelector("#signalBoard");
const issueListEl = document.querySelector("#issueList");
const riskListEl = document.querySelector("#riskList");
const suggestionListEl = document.querySelector("#suggestionList");
const replyPreviewEl = document.querySelector("#replyPreview");
const escalationListEl = document.querySelector("#escalationList");
const evidenceListEl = document.querySelector("#evidenceList");
const reportPreviewEl = document.querySelector("#reportPreview");
const agentTraceEl = document.querySelector("#agentTrace");
const agentLaneEl = document.querySelector("#agentLane");

const sampleButtons = [...document.querySelectorAll("[data-sample]")];
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const tabButtons = [...document.querySelectorAll("[data-tab]")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];

const state = {
  sample: "refundDelay",
  mode: "standard",
  tab: "overview"
};

const samples = {
  refundDelay: {
    label: "退款到账延迟",
    text: `买家 09:12：我三天前申请退款，页面写的是 48 小时到账，现在还是审核中。
商家 09:13：抱歉让您久等了，我先帮您核实退款单状态。
买家 09:14：昨天也有人这么说，但一直没人回我，我现在很不满意。
商家 09:16：系统里显示仓库签收状态还没同步，所以退款单卡在审核队列。
买家 09:17：那为什么订单页写的是已签收？你们前后说法不一致。
商家 09:18：您反馈得对，我这边立即升级退款审核，并在今天 18:00 前短信同步进度。
买家 09:19：如果今天还没结果，我就去平台投诉。
商家 09:20：理解您的着急，我会继续跟进，并申请补发一张 20 元补偿券。`
  },
  signedDispute: {
    label: "物流签收争议",
    text: `买家 20:05：系统显示今天下午已签收，但我根本没收到包裹。
商家 20:06：您好，我先帮您核实签收记录和派件站点。
买家 20:07：我刚刚问了门卫也没有，别再让我一直等。
商家 20:09：物流回传是前台代收，但没有上传签收照片，信息还不完整。
买家 20:10：如果是你们配送问题，我要退款并赔偿。
商家 20:12：我这边先登记异常签收排查，并联系站点在今晚 22:00 前回传签收凭证。
买家 20:13：如果查不到证据，我不会接受继续拖着。
商家 20:14：明白，如无法确认妥投，我会直接为您升级退款或补发处理。`
  },
  lateShipment: {
    label: "延迟发货赔付",
    text: `买家 14:21：商品承诺 48 小时发货，现在已经第 4 天了还没出库。
商家 14:22：抱歉耽误您了，我先核实仓库发货节点。
买家 14:23：你们活动页写了超时可赔付，我现在就想知道怎么处理。
商家 14:25：系统显示仓库缺货补货延迟，但活动页还保留了原始承诺。
买家 14:26：那就是你们规则没同步，我不想继续等了，要么退款要么赔付。
商家 14:28：理解，我先为您申请优先退款，并同步核实是否满足延迟发货补偿条件。
买家 14:29：今天能不能给我明确答复？
商家 14:30：可以，我会在今天 17:30 前把退款进度和赔付结果一并同步给您。`
  }
};

const modeConfig = {
  standard: { label: "标准仲裁", scoreBias: 0, suggestionDepth: 4 },
  strict: { label: "严格仲裁", scoreBias: -8, suggestionDepth: 5 },
  coach: { label: "教练模式", scoreBias: -2, suggestionDepth: 6 }
};

const issueRules = [
  {
    name: "退款时效争议",
    description: "退款审核、到账时效或退款节点超出承诺。",
    keywords: ["退款", "到账", "审核", "48 小时", "48小时", "超时", "退款单", "进度"]
  },
  {
    name: "履约状态冲突",
    description: "物流签收、仓库状态或页面展示前后不一致。",
    keywords: ["签收", "已签收", "未收到", "状态", "不同步", "出库", "物流", "代收", "照片"]
  },
  {
    name: "规则口径不一致",
    description: "页面承诺、活动规则与人工说明出现冲突。",
    keywords: ["规则", "承诺", "前后说法不一致", "前后不一致", "活动页", "赔付", "说明", "页面写"]
  },
  {
    name: "赔付升级风险",
    description: "买家已提出投诉、赔付或公开升级诉求。",
    keywords: ["投诉", "赔偿", "赔付", "平台", "不接受", "不想继续等", "退款并赔偿"]
  },
  {
    name: "责任判定待补证",
    description: "当前还缺签收凭证、仓库节点或支付路径证据。",
    keywords: ["凭证", "证据", "签收照片", "回传", "核实", "排查", "路径"]
  }
];

const negativeWords = ["投诉", "不满意", "还没", "一直", "为什么", "赔付", "赔偿", "拖着", "不接受", "着急", "尽快", "马上"];
const positiveWords = ["谢谢", "可以", "明白", "辛苦"];
const empathyWords = ["抱歉", "理解", "久等", "耽误", "着急", "困扰"];
const ownershipWords = ["我先帮您", "我这边", "我会", "立即", "先为您", "继续跟进", "升级", "同步"];
const timingWords = ["今天", "今晚", "明天", "18:00", "17:30", "22:00", "稍后", "之前", "前", "同步"];
const resolutionWords = ["退款", "补发", "补偿", "赔付", "升级", "短信", "回传", "排查", "优先", "核实", "凭证", "退款单"];
const evidenceWords = ["页面写", "活动页", "签收照片", "站点", "仓库", "代收", "审核", "到账", "出库", "凭证", "回传"];
const riskyAgentWords = ["不清楚", "只能等", "没办法", "系统问题", "你再等等", "我也不知道"];

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(text) {
  return text.replace(/\r/g, "").trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function countHits(text, keywords) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

function parseTranscript(rawText) {
  return rawText
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return null;
      }

      const match = trimmed.match(/^(买家|用户|顾客|客户|商家|客服|平台|仓库|物流|系统)\s*([0-2]?\d:\d{2})?\s*[:：]\s*(.+)$/);
      if (!match) {
        return {
          index,
          speaker: "note",
          roleLabel: "记录",
          time: "",
          content: trimmed
        };
      }

      const role = match[1];
      const speaker = ["买家", "用户", "顾客", "客户"].includes(role) ? "customer" : "agent";

      return {
        index,
        speaker,
        roleLabel: role,
        time: match[2] || "",
        content: match[3].trim()
      };
    })
    .filter(Boolean);
}

function emotionLabel(score) {
  if (score >= 72) return "较稳定";
  if (score >= 48) return "偏紧张";
  return "激烈";
}

function handlingLabel(score) {
  if (score >= 86) return "闭环完整";
  if (score >= 72) return "处理稳妥";
  if (score >= 58) return "仍可优化";
  return "建议人工介入";
}

function riskLabel(score) {
  if (score >= 75) return "高争议";
  if (score >= 50) return "中争议";
  return "低争议";
}

function severityFromText(text) {
  if (/投诉|赔偿|赔付|不接受|今天必须|升级/.test(text)) return "high";
  if (/不一致|延迟|不同步|退款|签收|凭证|证据/.test(text)) return "medium";
  return "low";
}

function analyzeIssues(text) {
  return issueRules
    .map((rule) => ({
      name: rule.name,
      description: rule.description,
      hits: countHits(text, rule.keywords)
    }))
    .filter((item) => item.hits > 0)
    .sort((left, right) => right.hits - left.hits)
    .slice(0, 4);
}

function extractResponsibilityNodes(turns) {
  return turns
    .filter(
      (turn) =>
        includesAny(turn.content, negativeWords) ||
        includesAny(turn.content, ["退款", "签收", "赔付", "赔偿", "凭证", "不一致", "升级", "回传"])
    )
    .map((turn) => ({
      actor: turn.roleLabel,
      text: turn.content,
      severity: severityFromText(turn.content)
    }))
    .slice(0, 5);
}

function buildSignals(metrics) {
  return [
    {
      label: "情绪安抚",
      value: metrics.empathyScore,
      hint: metrics.empathyScore >= 70 ? "安抚较到位" : "建议先接住情绪"
    },
    {
      label: "证据完整度",
      value: metrics.evidenceScore,
      hint: metrics.evidenceScore >= 70 ? "核心证据较全" : "仍缺节点凭证"
    },
    {
      label: "处置闭环",
      value: metrics.executionScore,
      hint: metrics.executionScore >= 70 ? "时限和动作明确" : "缺少回传承诺"
    },
    {
      label: "规则一致性",
      value: metrics.policyScore,
      hint: metrics.policyScore >= 70 ? "口径较稳" : "需要统一承诺口径"
    }
  ];
}

function evidenceReason(text) {
  if (includesAny(text, ["48 小时", "48小时", "超时", "第 4 天", "一直", "还没"])) return "超时主诉";
  if (includesAny(text, ["签收照片", "凭证", "回传", "代收", "站点"])) return "证据缺口";
  if (includesAny(text, ["前后说法不一致", "前后不一致", "活动页", "页面写", "规则"])) return "规则冲突";
  if (includesAny(text, ["投诉", "赔偿", "赔付"])) return "升级信号";
  if (includesAny(text, ["今天", "今晚", "17:30", "18:00", "22:00", "同步"])) return "处置承诺";
  return "关键片段";
}

function pickEvidence(turns) {
  const scored = turns.map((turn) => {
    let score = 1;
    score += includesAny(turn.content, negativeWords) ? 2.2 : 0;
    score += includesAny(turn.content, empathyWords) ? 1.2 : 0;
    score += includesAny(turn.content, resolutionWords) ? 2.1 : 0;
    score += includesAny(turn.content, evidenceWords) ? 2.3 : 0;
    score += /今天|今晚|18:00|17:30|22:00/.test(turn.content) ? 1.2 : 0;
    score += /投诉|赔偿|赔付|退款|签收/.test(turn.content) ? 1.6 : 0;
    return { ...turn, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 5)
    .sort((left, right) => left.index - right.index)
    .map((turn) => ({
      reason: evidenceReason(turn.content),
      role: turn.roleLabel,
      text: turn.content
    }));
}

function buildSuggestions(metrics, issues, nodes) {
  const suggestions = [];

  if (metrics.empathyScore < 70) suggestions.push("更早接住买家情绪，再进入责任核实与规则说明。");
  if (metrics.evidenceScore < 72) suggestions.push("补齐签收凭证、仓库节点或退款路径，避免责任判断悬空。");
  if (metrics.executionScore < 72) suggestions.push("给出明确时限、回传方式和下一步动作，避免只说“帮您核实”。");
  if (issues.some((item) => item.name === "规则口径不一致")) suggestions.push("统一活动页、订单页与人工说明里的承诺口径。");
  if (nodes.some((item) => item.severity === "high")) suggestions.push("出现投诉或赔付诉求后，应尽快触发人工仲裁阈值。");
  if (state.mode === "coach") suggestions.push("沉淀标准仲裁话术：责任判断、回传时点和补偿边界要一次说清。");

  return suggestions.slice(0, modeConfig[state.mode].suggestionDepth);
}

function buildEscalations(metrics, issues, nodes) {
  const escalations = [];

  if (metrics.riskScore >= 75) escalations.push("建议立即升级到人工仲裁或主管席。");
  if (issues.some((item) => item.name === "退款时效争议")) escalations.push("同步退款审核节点、支付回传路径和预计到账时间。");
  if (issues.some((item) => item.name === "履约状态冲突")) escalations.push("同步仓库、物流或站点侧凭证，优先确认签收责任。");
  if (issues.some((item) => item.name === "规则口径不一致")) escalations.push("建议锁定页面承诺截图，避免后续口径再次变化。");
  if (!nodes.length) escalations.push("当前未识别到明显升级信号，可按标准仲裁闭环处理。");

  return [...new Set(escalations)].slice(0, 4);
}

function buildReply(issues, metrics) {
  const names = issues.map((item) => item.name);
  const hasRefundDelay = names.includes("退款时效争议");
  const hasSignedDispute = names.includes("履约状态冲突");
  const hasRuleConflict = names.includes("规则口径不一致");

  let action =
    "我这边先为您核实当前处理节点，并把责任判断和下一步动作一次同步给您。";
  let deadline = "我会在今天 18:00 前把最新进度通过短信同步给您。";

  if (hasRefundDelay) {
    action =
      "我先为您核实退款审核节点和到账路径，如发现状态滞后或信息不同步，会立即升级处理。";
    deadline = "我会在今天 18:00 前把退款进度和预计到账时间同步给您。";
  }

  if (hasSignedDispute) {
    action =
      "我先为您核实站点签收记录、签收凭证和仓库流转节点，如无法确认妥投，会直接升级退款或补发处理。";
    deadline = "我会在今晚 22:00 前把核查结果和下一步方案同步给您。";
  }

  if (hasRuleConflict) {
    action += "同时我会对照活动页和订单页承诺，避免口径前后不一致。";
  }

  const tone = metrics.empathyScore >= 70 ? "抱歉让您久等了。" : "非常抱歉给您带来困扰。";
  return `${tone}${action}${deadline}如果超过承诺时点仍没有结果，您直接回复这条会话即可，我会继续为您跟进并升级处理。`;
}

function buildReport(summary, issues, metrics, nodes, suggestions, escalations, reply) {
  return [
    "【仲裁结论】",
    summary,
    "",
    "【争议分类】",
    issues.length ? issues.map((item) => `- ${item.name}（命中 ${item.hits} 项信号）`).join("\n") : "- 暂无分类",
    "",
    "【评分概览】",
    `- 履约得分：${metrics.handlingScore}（${handlingLabel(metrics.handlingScore)}）`,
    `- 买家情绪：${metrics.emotionScore}（${emotionLabel(metrics.emotionScore)}）`,
    `- 争议等级：${metrics.riskScore}（${riskLabel(metrics.riskScore)}）`,
    "",
    "【责任线索】",
    nodes.length ? nodes.map((item) => `- ${item.actor}：${item.text}`).join("\n") : "- 暂无明显责任线索",
    "",
    "【处置建议】",
    suggestions.length ? suggestions.map((item) => `- ${item}`).join("\n") : "- 暂无处置建议",
    "",
    "【升级建议】",
    escalations.length ? escalations.map((item) => `- ${item}`).join("\n") : "- 暂无升级建议",
    "",
    "【推荐回复】",
    reply
  ].join("\n");
}

function buildTraceEntries(metrics, issues, nodes, evidence, escalations, suggestions, reply) {
  return [
    {
      index: "01",
      agent: "受理 Agent",
      status: "success",
      summary: issues.length ? issues.map((item) => item.name).join(" / ") : "未识别出明确争议分类",
      detail: `买家情绪 ${metrics.emotionScore}，判定为 ${emotionLabel(metrics.emotionScore)}`
    },
    {
      index: "02",
      agent: "证据 Agent",
      status: metrics.evidenceScore >= 70 ? "success" : "warning",
      summary: evidence.length ? `抽取 ${evidence.length} 个关键证据片段` : "仍需补充关键证据",
      detail: `证据完整度 ${metrics.evidenceScore}`
    },
    {
      index: "03",
      agent: "规则 Agent",
      status: issues.some((item) => item.name === "规则口径不一致") ? "warning" : "success",
      summary: issues.some((item) => item.name === "规则口径不一致") ? "检测到规则口径冲突" : "规则口径基本稳定",
      detail: `规则一致性 ${metrics.policyScore}`
    },
    {
      index: "04",
      agent: "仲裁 Agent",
      status: metrics.riskScore >= 75 ? "danger" : "warning",
      summary: escalations.length ? `输出 ${escalations.length} 条升级或处置结论` : "当前可按标准路径处理",
      detail: `争议等级 ${riskLabel(metrics.riskScore)}`
    },
    {
      index: "05",
      agent: "回复 Agent",
      status: metrics.executionScore >= 70 ? "success" : "warning",
      summary: "已生成带时限承诺的仲裁回复",
      detail: reply
    },
    {
      index: "06",
      agent: "复盘 Agent",
      status: "success",
      summary: `生成 ${suggestions.length} 条优化建议和完整仲裁报告`,
      detail: "已汇总结论、证据、升级建议和推荐回复"
    }
  ];
}

function renderCompactItems(container, items, fallbackText, mapper) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-block">${fallbackText}</div>`;
    return;
  }

  container.innerHTML = items.map(mapper).join("");
}

function renderIssues(issues) {
  renderCompactItems(
    issueListEl,
    issues,
    "暂无分类",
    (item) => `
      <article class="compact-item">
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.description)}</p>
        <div class="compact-meta">
          <span class="score-badge">命中 ${item.hits}</span>
        </div>
      </article>
    `
  );
}

function renderResponsibilityNodes(nodes) {
  const labels = { high: "高争议", medium: "中争议", low: "低争议" };
  renderCompactItems(
    riskListEl,
    nodes,
    "暂无责任线索",
    (item) => `
      <article class="compact-item">
        <strong>${escapeHtml(item.text)}</strong>
        <div class="compact-meta">
          <span class="meta-badge">${escapeHtml(item.actor)}</span>
          <span class="severity-badge ${item.severity}">${labels[item.severity]}</span>
        </div>
      </article>
    `
  );
}

function renderSuggestions(suggestions) {
  renderCompactItems(
    suggestionListEl,
    suggestions,
    "暂无处置建议",
    (item) => `
      <article class="compact-item">
        <strong>${escapeHtml(item)}</strong>
      </article>
    `
  );
}

function renderEscalations(items) {
  renderCompactItems(
    escalationListEl,
    items,
    "暂无升级建议",
    (item) => `
      <article class="compact-item">
        <strong>${escapeHtml(item)}</strong>
      </article>
    `
  );
}

function renderEvidence(evidence) {
  renderCompactItems(
    evidenceListEl,
    evidence,
    "暂无核心证据",
    (item) => `
      <article class="compact-item">
        <strong>${escapeHtml(item.reason)}</strong>
        <p>${escapeHtml(item.role)}：${escapeHtml(item.text)}</p>
      </article>
    `
  );
}

function renderSignals(signals) {
  renderCompactItems(
    signalBoardEl,
    signals,
    "暂无评分",
    (item) => `
      <div class="signal-row">
        <div class="signal-head">
          <strong>${escapeHtml(item.label)}</strong>
          <span class="score-badge">${item.value}</span>
        </div>
        <div class="signal-track">
          <span class="signal-fill" style="width:${item.value}%"></span>
        </div>
        <p>${escapeHtml(item.hint)}</p>
      </div>
    `
  );
}

function renderTrace(entries) {
  const statusLabels = { success: "完成", warning: "关注", danger: "高争议" };

  renderCompactItems(
    agentTraceEl,
    entries,
    "暂无运行记录",
    (entry) => `
      <article class="trace-item">
        <div class="trace-head">
          <strong>${escapeHtml(entry.agent)}</strong>
          <span class="trace-badge ${entry.status}">${statusLabels[entry.status]}</span>
        </div>
        <p>${escapeHtml(entry.summary)}</p>
        <div class="trace-meta">
          <span class="meta-badge">${escapeHtml(entry.detail)}</span>
        </div>
      </article>
    `
  );
}

function renderLane(entries) {
  renderCompactItems(
    agentLaneEl,
    entries,
    "暂无链路",
    (entry) => `
      <article class="lane-item">
        <div class="lane-head">
          <span class="lane-index">${entry.index}</span>
          <span class="trace-badge ${entry.status}">${escapeHtml(entry.agent)}</span>
        </div>
        <strong>${escapeHtml(entry.summary)}</strong>
      </article>
    `
  );
}

function renderTags(tags) {
  tagCloudEl.innerHTML = tags.length
    ? tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
    : '<span class="tag placeholder-tag">等待标签</span>';
}

function updateModeAndSceneBadges() {
  sceneBadgeEl.textContent = samples[state.sample].label;
  modeBadgeEl.textContent = modeConfig[state.mode].label;
}

function setActiveTab(tab) {
  state.tab = tab;
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tab}`);
  });
}

function emptyDashboard(message) {
  turnCountEl.textContent = "0";
  turnMixEl.textContent = "买家 0 / 商家 0";
  emotionScoreEl.textContent = "0";
  emotionHintEl.textContent = "等待分析";
  serviceScoreEl.textContent = "0";
  scoreHintEl.textContent = "等待分析";
  riskScoreEl.textContent = "0";
  riskHintEl.textContent = "等待分析";
  summaryMetaEl.textContent = "尚未开始仲裁";
  summaryOutputEl.className = "summary-text empty-text";
  summaryOutputEl.textContent = message;
  renderTags([]);
  renderIssues([]);
  renderResponsibilityNodes([]);
  renderSuggestions([]);
  renderEscalations([]);
  renderEvidence([]);
  renderSignals([]);
  renderTrace([]);
  renderLane([]);
  replyPreviewEl.textContent = "等待生成推荐回复";
  reportPreviewEl.textContent = "等待生成仲裁报告";
}

function analyzeTranscript() {
  const rawText = normalizeText(documentInput.value);
  const turns = parseTranscript(rawText);

  if (!rawText || turns.length < 4) {
    emptyDashboard("请补充至少 4 轮以上的争议对话，再开始仲裁。");
    return;
  }

  const customerTurns = turns.filter((turn) => turn.speaker === "customer");
  const agentTurns = turns.filter((turn) => turn.speaker === "agent");
  const fullText = turns.map((turn) => turn.content).join(" ");

  const customerNegative = customerTurns.reduce((total, turn) => total + countHits(turn.content, negativeWords), 0);
  const customerPositive = customerTurns.reduce((total, turn) => total + countHits(turn.content, positiveWords), 0);
  const empathyCount = agentTurns.reduce((total, turn) => total + countHits(turn.content, empathyWords), 0);
  const ownershipCount = agentTurns.reduce((total, turn) => total + countHits(turn.content, ownershipWords), 0);
  const timingCount = agentTurns.reduce((total, turn) => total + countHits(turn.content, timingWords), 0);
  const resolutionCount = agentTurns.reduce((total, turn) => total + countHits(turn.content, resolutionWords), 0);
  const evidenceCount = turns.reduce((total, turn) => total + countHits(turn.content, evidenceWords), 0);
  const riskyAgentCount = agentTurns.reduce((total, turn) => total + countHits(turn.content, riskyAgentWords), 0);
  const repeatComplaintCount = customerTurns.filter((turn) => /昨天也|一直|根本没收到|不想继续等|别再让我|今天还没结果/.test(turn.content)).length;

  const issues = analyzeIssues(fullText);
  const handlingScore = clamp(
    58 +
      empathyCount * 6 +
      ownershipCount * 5 +
      timingCount * 5 +
      resolutionCount * 5 +
      evidenceCount * 3 -
      customerNegative * 2.4 -
      riskyAgentCount * 10 -
      repeatComplaintCount * 4 +
      modeConfig[state.mode].scoreBias,
    28,
    97
  );
  const emotionScore = clamp(72 - customerNegative * 7 + customerPositive * 5 + empathyCount * 2, 18, 95);
  const riskScore = clamp(
    24 +
      customerNegative * 7 +
      repeatComplaintCount * 6 +
      (timingCount === 0 ? 16 : 0) +
      (ownershipCount === 0 ? 10 : 0) +
      (issues.some((item) => item.name === "规则口径不一致") ? 12 : 0) +
      (issues.some((item) => item.name === "赔付升级风险") ? 15 : 0) +
      (issues.some((item) => item.name === "履约状态冲突") ? 8 : 0),
    8,
    96
  );

  const metrics = {
    handlingScore,
    emotionScore,
    riskScore,
    empathyScore: clamp(35 + empathyCount * 18, 20, 96),
    evidenceScore: clamp(38 + evidenceCount * 10 + ownershipCount * 8 - riskyAgentCount * 8, 20, 96),
    executionScore: clamp(34 + resolutionCount * 14 + timingCount * 12, 18, 97),
    policyScore: clamp(
      82 - (issues.some((item) => item.name === "规则口径不一致") ? 26 : 0) - riskyAgentCount * 10,
      28,
      95
    )
  };

  const responsibilityNodes = extractResponsibilityNodes(turns);
  const suggestions = buildSuggestions(metrics, issues, responsibilityNodes);
  const escalations = buildEscalations(metrics, issues, responsibilityNodes);
  const evidence = pickEvidence(turns);
  const reply = buildReply(issues, metrics);
  const traceEntries = buildTraceEntries(metrics, issues, responsibilityNodes, evidence, escalations, suggestions, reply);

  const mainIssue = issues.length ? issues[0].name : "一般退款争议";
  const summary = `本次争议主要集中在${mainIssue}。当前对话已经出现${issues.some((item) => item.name === "规则口径不一致") ? "规则口径冲突" : "退款或履约压力"}信号，${ownershipCount > 0 ? "商家已给出接手动作" : "责任承接仍偏弱"}，买家情绪处于${emotionLabel(emotionScore)}状态，整体争议等级为${riskLabel(riskScore)}。建议优先补齐${issues.some((item) => item.name === "履约状态冲突") || issues.some((item) => item.name === "责任判定待补证") ? "签收、仓储或回传凭证" : "退款节点和到账时点"}后，再给出最终处置结论。`;
  const tags = [
    ...(issues.length ? issues.map((item) => item.name) : ["通用仲裁"]),
    emotionLabel(emotionScore),
    riskLabel(riskScore)
  ].slice(0, 5);
  const report = buildReport(summary, issues, metrics, responsibilityNodes, suggestions, escalations, reply);

  turnCountEl.textContent = String(turns.length);
  turnMixEl.textContent = `买家 ${customerTurns.length} / 商家 ${agentTurns.length}`;
  emotionScoreEl.textContent = String(emotionScore);
  emotionHintEl.textContent = emotionLabel(emotionScore);
  serviceScoreEl.textContent = String(handlingScore);
  scoreHintEl.textContent = handlingLabel(handlingScore);
  riskScoreEl.textContent = String(riskScore);
  riskHintEl.textContent = riskLabel(riskScore);
  summaryMetaEl.textContent = `${modeConfig[state.mode].label} · ${turns.length} 轮会话`;
  summaryOutputEl.className = "summary-text";
  summaryOutputEl.textContent = summary;

  renderTags([...new Set(tags)]);
  renderIssues(issues);
  renderResponsibilityNodes(responsibilityNodes);
  renderSuggestions(suggestions);
  renderEscalations(escalations);
  renderEvidence(evidence);
  renderSignals(buildSignals(metrics));
  renderTrace(traceEntries);
  renderLane(traceEntries);
  replyPreviewEl.textContent = reply;
  reportPreviewEl.textContent = report;
}

function setSample(sampleKey) {
  state.sample = sampleKey;
  sampleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sample === sampleKey);
  });
  updateModeAndSceneBadges();
}

function setMode(modeKey) {
  state.mode = modeKey;
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === modeKey);
  });
  updateModeAndSceneBadges();
}

function loadCurrentSample() {
  documentInput.value = samples[state.sample].text;
  analyzeTranscript();
}

function clearTranscript() {
  documentInput.value = "";
  emptyDashboard("点击“运行工作流”后，这里会生成一段简洁的仲裁结论。");
}

async function copyText(text, onSuccess, onFail) {
  if (!text || text.startsWith("等待生成")) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    onSuccess();
  } catch {
    onFail();
  }
}

sampleButtons.forEach((button) => {
  button.addEventListener("click", () => setSample(button.dataset.sample));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
    if (normalizeText(documentInput.value)) analyzeTranscript();
  });
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

loadSampleButton.addEventListener("click", loadCurrentSample);
clearButton.addEventListener("click", clearTranscript);
analyzeButton.addEventListener("click", analyzeTranscript);

copyReplyButton.addEventListener("click", () => {
  copyText(
    replyPreviewEl.textContent,
    () => {
      scoreHintEl.textContent = "推荐回复已复制";
    },
    () => {
      scoreHintEl.textContent = "复制失败";
    }
  );
});

copyReportButton.addEventListener("click", () => {
  copyText(
    reportPreviewEl.textContent,
    () => {
      riskHintEl.textContent = "仲裁报告已复制";
    },
    () => {
      riskHintEl.textContent = "复制失败";
    }
  );
});

documentInput.addEventListener("input", () => {
  if (!normalizeText(documentInput.value)) {
    emptyDashboard("点击“运行工作流”后，这里会生成一段简洁的仲裁结论。");
  }
});

setSample(state.sample);
setMode(state.mode);
setActiveTab(state.tab);
loadCurrentSample();
