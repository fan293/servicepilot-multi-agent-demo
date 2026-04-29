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

const sampleButtons = [...document.querySelectorAll("[data-sample]")];
const modeButtons = [...document.querySelectorAll("[data-mode]")];

const state = {
  sample: "refund",
  mode: "standard"
};

const samples = {
  refund: {
    label: "退款争议",
    text: `客户 09:12：我上周申请退款，到现在还没到账，你们页面写的是 48 小时处理，现在已经第四天了。
客服 09:13：抱歉让您久等了，我先帮您核实一下订单状态。
客户 09:14：上一个客服也是这么说的，但一直没人回我，我现在非常不满意。
客服 09:16：我看到系统里退款单还在审核中，可能是仓库签收状态没有同步。
客户 09:17：那为什么页面显示已经签收？你们规则是不是前后不一致？
客服 09:18：您反馈的情况确实有偏差，我这边先为您升级加急，并登记专员回电。
客户 09:19：我今天必须知道结果，不然我就投诉。
客服 09:20：理解您的着急，我会在今天 18:00 前短信同步处理进度，并补充一张 20 元无门槛券作为体验补偿。`
  },
  shipping: {
    label: "物流催单",
    text: `客户 20:05：我的订单已经显示揽收三天了，一点物流更新都没有，你们到底发没发？
客服 20:06：您好，我先帮您查看一下物流详情，请稍等。
客户 20:07：我昨天也问过，你们只是让我等，我现在急着要用。
客服 20:09：抱歉让您反复确认，我这边查到包裹已经从中转仓发出，但承运商扫描延迟了。
客户 20:10：那你们能不能给个明确时间？不要一直说在路上。
客服 20:12：可以，我这边先帮您登记物流催派，并联系承运商优先核实，预计今晚 22:00 前给您短信反馈。
客户 20:13：如果明天还不到，我就直接申请退款了。
客服 20:14：理解您的顾虑，如果明天中午前仍未更新，我会为您继续升级，并同步退款或补偿方案。`
  },
  membership: {
    label: "会员投诉",
    text: `客户 14:21：我根本不知道会员自动续费了，今天突然扣了 198 元，这个体验太差了。
客服 14:22：抱歉给您带来困扰，我先帮您确认一下扣费记录。
客户 14:23：你们没有明显提醒，我已经很久没用了，为什么还会自动续？
客服 14:25：系统显示您去年开通时勾选了自动续费，但我理解这个提醒方式可能不够清楚。
客户 14:26：我现在要求退款，而且不接受只关自动续费。
客服 14:28：明白，我这边先帮您关闭自动续费，并提交退款审核申请。
客户 14:29：多久能有结果？我不想再反复跟进。
客服 14:30：我会在今天 17:00 前通过短信和站内信同步审核结果，如审核未通过，我会继续为您升级人工复核。`
  }
};

const modeConfig = {
  standard: { label: "标准质检", scoreBias: 0, suggestionDepth: 4 },
  strict: { label: "严格质检", scoreBias: -8, suggestionDepth: 5 },
  coach: { label: "教练模式", scoreBias: -2, suggestionDepth: 6 }
};

const issueRules = [
  {
    name: "退款争议",
    description: "涉及退款时效、退款规则、到账延迟或审核状态不清。",
    keywords: ["退款", "到账", "审核", "签收", "补偿"]
  },
  {
    name: "物流异常",
    description: "涉及发货延迟、物流停滞、催单、承运商扫描异常。",
    keywords: ["物流", "揽收", "发货", "催派", "承运商", "在路上"]
  },
  {
    name: "会员续费投诉",
    description: "涉及自动续费、扣费提醒、退款诉求和会员体验争议。",
    keywords: ["续费", "扣费", "会员", "自动续费", "提醒"]
  },
  {
    name: "规则说明冲突",
    description: "用户感知到页面说明、政策口径或客服话术存在冲突。",
    keywords: ["规则", "不一致", "为什么", "说明", "口径"]
  },
  {
    name: "升级投诉风险",
    description: "用户已表达强烈不满，存在差评、投诉或流失风险。",
    keywords: ["投诉", "差评", "不满意", "非常不满意", "太差了", "不接受"]
  }
];

const negativeWords = ["投诉", "不满意", "太差", "为什么", "还没", "一直", "急着", "不接受", "马上", "尽快", "很久", "反复"];
const positiveWords = ["谢谢", "理解", "可以", "麻烦了", "辛苦了"];
const empathyWords = ["抱歉", "理解", "久等", "给您带来困扰", "着急", "顾虑"];
const ownershipWords = ["我来帮您", "我先帮您", "我这边", "已为您", "帮您登记", "帮您关闭", "继续为您", "为您升级"];
const timingWords = ["今天", "今晚", "明天", "18:00", "17:00", "22:00", "中午前", "前", "稍后", "短信同步"];
const resolutionWords = ["升级", "工单", "加急", "短信", "回电", "补偿", "退款审核", "催派", "优先核实", "关闭自动续费"];
const riskyAgentWords = ["没办法", "不清楚", "你自己", "等着吧", "只能这样", "系统问题", "我也不知道"];

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

      const match = trimmed.match(/^(客户|用户|买家|顾客|客服|坐席|商家|机器人)\s*([0-2]?\d:\d{2})?\s*[:：]\s*(.+)$/);
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
      const speaker = ["客户", "用户", "买家", "顾客"].includes(role) ? "customer" : "agent";

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

function sentimentLabel(score) {
  if (score >= 72) {
    return "较稳定";
  }
  if (score >= 48) {
    return "偏紧张";
  }
  return "高波动";
}

function serviceLabel(score) {
  if (score >= 86) {
    return "表现优秀";
  }
  if (score >= 72) {
    return "整体稳妥";
  }
  if (score >= 58) {
    return "可继续优化";
  }
  return "建议重点复盘";
}

function riskLabel(score) {
  if (score >= 75) {
    return "高风险";
  }
  if (score >= 50) {
    return "中风险";
  }
  return "低风险";
}

function severityFromText(text) {
  if (/投诉|差评|今天必须|不接受|流失|升级/.test(text)) {
    return "high";
  }
  if (/不一致|延迟|没有同步|规则|催单|退款/.test(text)) {
    return "medium";
  }
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

function extractRiskNodes(turns) {
  return turns
    .filter((turn) => includesAny(turn.content, negativeWords) || includesAny(turn.content, ["投诉", "不一致", "退款", "催派", "升级", "自动续费"]))
    .map((turn) => ({
      actor: turn.roleLabel,
      text: turn.content,
      severity: severityFromText(turn.content)
    }))
    .slice(0, 5);
}

function buildSignals(metrics) {
  return [
    { label: "情绪安抚", value: metrics.empathyScore, hint: metrics.empathyScore >= 70 ? "安抚到位" : "安抚偏弱" },
    { label: "表达清晰度", value: metrics.clarityScore, hint: metrics.clarityScore >= 70 ? "说明清楚" : "建议更具体" },
    { label: "执行承诺", value: metrics.executionScore, hint: metrics.executionScore >= 70 ? "动作明确" : "缺少闭环" },
    { label: "规范性", value: metrics.policyScore, hint: metrics.policyScore >= 70 ? "规范较稳" : "口径需统一" }
  ];
}

function pickEvidence(turns) {
  const scored = turns.map((turn) => {
    let score = 1;
    score += includesAny(turn.content, negativeWords) ? 2.2 : 0;
    score += includesAny(turn.content, empathyWords) ? 1.8 : 0;
    score += includesAny(turn.content, resolutionWords) ? 2.1 : 0;
    score += /今天|明天|18:00|17:00|22:00/.test(turn.content) ? 1.2 : 0;
    score += /投诉|不接受|升级|补偿|退款/.test(turn.content) ? 1.6 : 0;

    return { ...turn, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 5)
    .sort((left, right) => left.index - right.index)
    .map((turn, index) => ({
      reason: ["高风险瞬间", "安抚动作", "解决承诺", "升级信号", "复盘重点"][index] || "关键证据",
      role: turn.roleLabel,
      text: turn.content
    }));
}

function buildSuggestions(metrics, issues, risks) {
  const suggestions = [];

  if (metrics.empathyScore < 70) {
    suggestions.push("在前两轮回复中更早表达共情，先接住用户情绪，再进入核实流程。");
  }
  if (metrics.clarityScore < 72) {
    suggestions.push("给出更明确的处理路径和时间节点，避免只说“帮您核实”而没有下文。");
  }
  if (metrics.executionScore < 72) {
    suggestions.push("增加闭环动作，例如短信回传、工单编号、回电时间或升级状态。");
  }
  if (issues.some((item) => item.name === "规则说明冲突")) {
    suggestions.push("统一页面说明、知识库条目和客服口径，减少用户感知到的规则冲突。");
  }
  if (risks.some((item) => item.severity === "high")) {
    suggestions.push("对于已出现投诉信号的会话，建议设置主管介入阈值，避免前线坐席单独承压。");
  }
  if (state.mode === "coach") {
    suggestions.push("把优秀回复沉淀为标准话术模板，并加入带时限承诺的固定句式。");
  }

  return suggestions.slice(0, modeConfig[state.mode].suggestionDepth);
}

function buildEscalations(metrics, issues, risks) {
  const escalations = [];

  if (metrics.riskScore >= 75) {
    escalations.push("建议立即升级到主管或高级客服，避免用户继续投诉扩散。");
  }
  if (issues.some((item) => item.name === "退款争议")) {
    escalations.push("退款类问题建议同步审核节点和到账预期，必要时补充补偿策略。");
  }
  if (issues.some((item) => item.name === "物流异常")) {
    escalations.push("物流类问题建议触发催派或异常件排查，而不是只做被动等待。");
  }
  if (issues.some((item) => item.name === "会员续费投诉")) {
    escalations.push("续费争议建议同步关闭自动续费，并给出退款审核与复核路径。");
  }
  if (risks.length === 0) {
    escalations.push("当前会话无明显升级信号，可继续按标准闭环流程处理。");
  }

  return [...new Set(escalations)].slice(0, 4);
}

function buildReply(issues, metrics) {
  const issueNames = issues.map((item) => item.name);
  const hasRefund = issueNames.includes("退款争议");
  const hasShipping = issueNames.includes("物流异常");
  const hasMembership = issueNames.includes("会员续费投诉");

  let coreAction = "我这边先帮您核实当前处理状态，并为您登记优先跟进。";
  let deadline = "我会在今天 18:00 前把最新进展通过短信同步给您。";

  if (hasRefund) {
    coreAction = "我这边先为您核实退款审核节点，并同步确认到账进度，若存在系统状态不同步，我会立即帮您升级加急处理。";
  } else if (hasShipping) {
    coreAction = "我先帮您登记物流催派，并联系承运商核实停滞原因，避免您继续反复跟进。";
    deadline = "我会在今晚 22:00 前把物流反馈结果同步给您。";
  } else if (hasMembership) {
    coreAction = "我先帮您确认扣费记录，并同步处理自动续费关闭与退款审核申请。";
    deadline = "我会在今天 17:00 前把审核结果和下一步处理方案发给您。";
  }

  const tone = metrics.empathyScore >= 70 ? "抱歉让您这次处理感受不好" : "非常抱歉给您带来困扰";

  return `${tone}。${coreAction}${deadline}如果在承诺时间内还没有结果，您可以直接回复这条会话，我会继续为您跟进并升级处理。`;
}

function buildReport(summary, issues, metrics, risks, suggestions, escalations, reply) {
  return [
    "【复盘结论】",
    summary,
    "",
    "【问题分类】",
    issues.length ? issues.map((item) => `- ${item.name}（命中 ${item.hits} 项信号）`).join("\n") : "- 暂无分类",
    "",
    "【评分概览】",
    `- 服务得分：${metrics.serviceScore}`,
    `- 客户情绪：${metrics.emotionScore}（${sentimentLabel(metrics.emotionScore)}）`,
    `- 风险等级：${metrics.riskScore}（${riskLabel(metrics.riskScore)}）`,
    "",
    "【风险节点】",
    risks.length ? risks.map((item) => `- ${item.actor}：${item.text}`).join("\n") : "- 暂无明显风险节点",
    "",
    "【改进建议】",
    suggestions.length ? suggestions.map((item) => `- ${item}`).join("\n") : "- 暂无建议",
    "",
    "【升级建议】",
    escalations.length ? escalations.map((item) => `- ${item}`).join("\n") : "- 暂无升级建议",
    "",
    "【推荐回复】",
    reply
  ].join("\n");
}

function buildTraceEntries(metrics, issues, risks, reply, escalations, suggestions) {
  return [
    {
      agent: "分诊 Agent",
      status: "success",
      focus: "识别主诉、问题类型和客户情绪",
      output: issues.length ? `识别为 ${issues.map((item) => item.name).join(" / ")}` : "未识别出明确分类",
      detail: `客户情绪评分 ${metrics.emotionScore}，当前判定为 ${sentimentLabel(metrics.emotionScore)}`
    },
    {
      agent: "规则 Agent",
      status: issues.some((item) => item.name === "规则说明冲突") ? "warning" : "success",
      focus: "检查规则口径、SLA 时限和承诺缺口",
      output: issues.some((item) => item.name === "规则说明冲突") ? "检测到规则冲突信号" : "未发现明显规则冲突",
      detail: `规范性评分 ${metrics.policyScore}，${metrics.policyScore >= 70 ? "规则说明整体稳定" : "建议统一页面说明与知识库口径"}`
    },
    {
      agent: "回复 Agent",
      status: metrics.executionScore >= 70 ? "success" : "warning",
      focus: "生成更稳的客服回复和闭环承诺",
      output: `生成 1 条带时限承诺的推荐回复`,
      detail: reply
    },
    {
      agent: "升级 Agent",
      status: metrics.riskScore >= 75 ? "danger" : "warning",
      focus: "判断是否需要主管介入、补偿或工单升级",
      output: escalations.length ? `输出 ${escalations.length} 条升级建议` : "当前无升级建议",
      detail: risks.length ? `识别到 ${risks.length} 个风险节点，风险等级为 ${riskLabel(metrics.riskScore)}` : "未识别明显风险节点"
    },
    {
      agent: "复盘 Agent",
      status: "success",
      focus: "汇总质检结论、改进建议和复盘报告",
      output: `生成 ${suggestions.length} 条改进建议和完整复盘报告`,
      detail: "已将关键结论、风险节点、升级建议和推荐回复汇总为可复制报告"
    }
  ];
}

function renderTags(tags) {
  tagCloudEl.innerHTML = tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
}

function renderSignals(signals) {
  signalBoardEl.innerHTML = signals
    .map(
      (item) => `
        <div class="signal-row">
          <div class="signal-head">
            <span>${escapeHtml(item.label)}</span>
            <span class="score-badge">${item.value}</span>
          </div>
          <div class="signal-track">
            <span class="signal-fill" style="width:${item.value}%"></span>
          </div>
          <p>${escapeHtml(item.hint)}</p>
        </div>
      `
    )
    .join("");
}

function renderIssues(issues) {
  if (!issues.length) {
    issueListEl.innerHTML = '<div class="empty-block">暂无分类</div>';
    return;
  }

  issueListEl.innerHTML = issues
    .map(
      (item) => `
        <article class="issue-item">
          <div class="issue-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="score-badge">命中 ${item.hits}</span>
          </div>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `
    )
    .join("");
}

function renderRiskNodes(risks) {
  if (!risks.length) {
    riskListEl.innerHTML = '<div class="empty-block">暂无风险节点</div>';
    return;
  }

  const severityLabels = {
    high: "高风险",
    medium: "中风险",
    low: "低风险"
  };

  riskListEl.innerHTML = risks
    .map(
      (item) => `
        <article class="stack-card">
          <strong>${escapeHtml(item.text)}</strong>
          <div class="stack-meta">
            <span class="meta-badge">${escapeHtml(item.actor)}</span>
            <span class="severity-badge ${item.severity}">${severityLabels[item.severity]}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTextList(container, items, fallbackText) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-block">${fallbackText}</div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="stack-card">
          <strong>${escapeHtml(item)}</strong>
        </article>
      `
    )
    .join("");
}

function renderEvidence(evidence) {
  if (!evidence.length) {
    evidenceListEl.innerHTML = '<div class="empty-block">暂无关键证据</div>';
    return;
  }

  evidenceListEl.innerHTML = evidence
    .map(
      (item) => `
        <article class="evidence-card">
          <div class="evidence-meta">
            <span class="evidence-reason">${escapeHtml(item.reason)}</span>
            <span class="meta-badge">${escapeHtml(item.role)}</span>
          </div>
          <blockquote>${escapeHtml(item.text)}</blockquote>
        </article>
      `
    )
    .join("");
}

function renderTrace(entries) {
  if (!entries.length) {
    agentTraceEl.innerHTML = '<div class="empty-block">暂无运行记录</div>';
    return;
  }

  const labelMap = {
    success: "完成",
    warning: "需关注",
    danger: "高风险"
  };

  agentTraceEl.innerHTML = entries
    .map(
      (entry) => `
        <article class="trace-card">
          <div class="trace-head">
            <strong>${escapeHtml(entry.agent)}</strong>
            <span class="trace-badge ${entry.status}">${labelMap[entry.status]}</span>
          </div>
          <p><strong>关注点：</strong>${escapeHtml(entry.focus)}</p>
          <p><strong>输出：</strong>${escapeHtml(entry.output)}</p>
          <div class="trace-meta">
            <span class="meta-badge">${escapeHtml(entry.detail)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function updateModeAndSceneBadges() {
  sceneBadgeEl.textContent = samples[state.sample].label;
  modeBadgeEl.textContent = modeConfig[state.mode].label;
}

function emptyDashboard(message) {
  turnCountEl.textContent = "0";
  turnMixEl.textContent = "客户 0 / 客服 0";
  emotionScoreEl.textContent = "0";
  emotionHintEl.textContent = "等待分析";
  serviceScoreEl.textContent = "0";
  scoreHintEl.textContent = "等待分析";
  riskScoreEl.textContent = "0";
  riskHintEl.textContent = "等待分析";
  summaryMetaEl.textContent = "尚未开始运行";
  summaryOutputEl.className = "summary-text empty-text";
  summaryOutputEl.textContent = message;
  tagCloudEl.innerHTML = '<span class="tag placeholder-tag">等待标签</span>';
  signalBoardEl.innerHTML = '<div class="empty-block">暂无评分</div>';
  issueListEl.innerHTML = '<div class="empty-block">暂无分类</div>';
  riskListEl.innerHTML = '<div class="empty-block">暂无风险节点</div>';
  suggestionListEl.innerHTML = '<div class="empty-block">暂无改进建议</div>';
  replyPreviewEl.textContent = "等待生成推荐回复";
  escalationListEl.innerHTML = '<div class="empty-block">暂无升级建议</div>';
  evidenceListEl.innerHTML = '<div class="empty-block">暂无关键证据</div>';
  reportPreviewEl.textContent = "等待生成复盘报告";
  agentTraceEl.innerHTML = '<div class="empty-block">暂无运行记录</div>';
}

function analyzeTranscript() {
  const rawText = normalizeText(documentInput.value);
  const turns = parseTranscript(rawText);

  if (!rawText || turns.length < 4) {
    emptyDashboard("请补充至少 4 轮以上的客服对话，再开始质检。");
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
  const riskyAgentCount = agentTurns.reduce((total, turn) => total + countHits(turn.content, riskyAgentWords), 0);
  const repeatComplaintCount = customerTurns.filter((turn) => /又|还是|一直|还没|昨天也/.test(turn.content)).length;

  const issues = analyzeIssues(fullText);

  const serviceScore = clamp(
    56 +
      empathyCount * 6 +
      ownershipCount * 5 +
      timingCount * 6 +
      resolutionCount * 5 -
      customerNegative * 2.6 -
      riskyAgentCount * 9 -
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
      (issues.some((item) => item.name === "规则说明冲突") ? 12 : 0) +
      (issues.some((item) => item.name === "升级投诉风险") ? 15 : 0),
    8,
    96
  );

  const metrics = {
    serviceScore,
    emotionScore,
    riskScore,
    empathyScore: clamp(35 + empathyCount * 18, 20, 96),
    clarityScore: clamp(40 + timingCount * 16 + ownershipCount * 10, 22, 96),
    executionScore: clamp(32 + resolutionCount * 14 + timingCount * 10, 18, 97),
    policyScore: clamp(80 - (issues.some((item) => item.name === "规则说明冲突") ? 24 : 0) - riskyAgentCount * 10, 28, 95)
  };

  const riskNodes = extractRiskNodes(turns);
  const suggestions = buildSuggestions(metrics, issues, riskNodes);
  const escalations = buildEscalations(metrics, issues, riskNodes);
  const evidence = pickEvidence(turns);
  const reply = buildReply(issues, metrics);
  const traceEntries = buildTraceEntries(metrics, issues, riskNodes, reply, escalations, suggestions);

  const summary = `这段会话主要聚焦于${issues.length ? issues[0].name : "一般售后处理"}。当前客服在${timingCount > 0 ? "时限承诺" : "时限说明"}和${ownershipCount > 0 ? "问题接手" : "主动接手"}方面${serviceScore >= 72 ? "表现较稳" : "仍有提升空间"}，但用户情绪处于${sentimentLabel(emotionScore)}状态，整体风险等级为${riskLabel(riskScore)}。`;
  const tags = [
    ...(issues.length ? issues.map((item) => item.name) : ["通用质检"]),
    sentimentLabel(emotionScore),
    riskLabel(riskScore)
  ].slice(0, 5);
  const report = buildReport(summary, issues, metrics, riskNodes, suggestions, escalations, reply);

  turnCountEl.textContent = String(turns.length);
  turnMixEl.textContent = `客户 ${customerTurns.length} / 客服 ${agentTurns.length}`;
  emotionScoreEl.textContent = String(emotionScore);
  emotionHintEl.textContent = sentimentLabel(emotionScore);
  serviceScoreEl.textContent = String(serviceScore);
  scoreHintEl.textContent = serviceLabel(serviceScore);
  riskScoreEl.textContent = String(riskScore);
  riskHintEl.textContent = riskLabel(riskScore);
  summaryMetaEl.textContent = `${modeConfig[state.mode].label} · 自动抽取 ${turns.length} 轮会话信号`;
  summaryOutputEl.className = "summary-text";
  summaryOutputEl.textContent = summary;

  renderTags([...new Set(tags)]);
  renderSignals(buildSignals(metrics));
  renderIssues(issues);
  renderRiskNodes(riskNodes);
  renderTextList(suggestionListEl, suggestions, "暂无改进建议");
  replyPreviewEl.textContent = reply;
  renderTextList(escalationListEl, escalations, "暂无升级建议");
  renderEvidence(evidence);
  reportPreviewEl.textContent = report;
  renderTrace(traceEntries);
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
  emptyDashboard("点击“运行 Agent 工作流”后，这里会生成面向主管复盘的简明结论。");
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
  button.addEventListener("click", () => {
    setSample(button.dataset.sample);
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
    if (normalizeText(documentInput.value)) {
      analyzeTranscript();
    }
  });
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
      riskHintEl.textContent = "复盘报告已复制";
    },
    () => {
      riskHintEl.textContent = "复制失败";
    }
  );
});

documentInput.addEventListener("input", () => {
  if (!normalizeText(documentInput.value)) {
    emptyDashboard("点击“运行 Agent 工作流”后，这里会生成面向主管复盘的简明结论。");
  }
});

setSample(state.sample);
setMode(state.mode);
loadCurrentSample();
