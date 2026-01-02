## 总体目标
- 接入 InsForge Claude（MCP）做真正的演奏 AI 分析，并返回结构化建议与评分
- 麦克风实时音高识别，精确到“弦+品位”的位置，并在指板上高亮
- 不同风格（rock/blues/metal）与不同 Key 的音阶映射到指板，支持切换
- Tempo 节拍器（可启停、重拍强调、Subdivision）与录音/分析协同

## 后端（InsForge AI + Edge Function）
- 创建 Edge Function: `analyze-improv`
  - 入参：`{noteEvents: {note, frequency, timestamp, duration}[], style, key, tempo}`
  - 调用 InsForge AI：`ai.chat.completions.create({ model: 'anthropic/claude-3.5-sonnet', messages })`
  - 产出结构化 JSON：`{ overallScore, feedback[], strengths[], weaknesses[], suggestions[], metrics: {scaleAdherence, timingAccuracy, pitchControl, phraseConsistency, styleMatch} }`
  - 返回 Response(JSON)
- 安全与配额：将 AI 调用置于 Edge Function，避免在前端直接发起；对请求做最小化校验与速率限制（简单节流）

## 前端集成
- API 层：在 `src/services/aiAnalysis.ts` 中改为调用 `functions.invoke('analyze-improv', payload)`，解析返回 JSON，渲染结果面板
- 错误处理：断网/超时/模型故障 fallback 到本地打分，并在 UI 提示
- 结果面板：显示分数、维度评分、Claude 文本点评、行动建议；支持复制/保存

## 实时音显示（精确到弦+品）
- 频率到位置映射：
  - 弦基频：E2 82.41Hz、A2 110Hz、D3 146.83Hz、G3 196.00Hz、B3 246.94Hz、E4 329.63Hz
  - 计算品位：`fret = round(12 * log2(freq / openFreq))`
  - 容差（cents）：`abs( 1200*log2(freq / (openFreq*2^(fret/12))) ) <= 30` 则命中
  - 命中 0–16 品间的第一个满足容差的弦即为定位的格子
- 抖动抑制：滑动窗口 + 中位数滤波（50–80ms），避免高亮闪烁
- UI：只高亮被定位的那个格子（紫色），对应弦显示轻微振动动画；最近演奏轨迹做淡出

## 指板音阶映射（风格/Key）
- 音阶库：
  - Rock：Major/Minor Pentatonic
  - Blues：Minor Pentatonic + Blues Note（b5）
  - Metal：Natural Minor + Phrygian（可选）
- 计算规则：根据 Key 的根音在 12 音列的位置，按音阶间隔生成 pitch class 集合
- 映射到指板：以每弦 openNote 为起点，对 0–16 品位计算音名，若在集合中则灰色圆标记（即可视为“可用音”）
- 切换：Style/Key 控制器更新映射（HMR 安全、无闪烁）

## 节拍器（Tempo）
- WebAudio 定时：使用 `AudioContext` + `setInterval` 预调度 100–150ms，避免 `setTimeout` 漂移
- 声音：Downbeat（拍 1）用高音 click，其他拍用低音；可选 subdivision（例如 1/8）
- UI：节拍指示灯/进度环；Start/Stop；BPM 滑块与输入框联动
- 录音协同：把当下 `AudioContext.currentTime` 映射到真实时间戳，记录 noteEvents 的节拍位置（bar/beat/subdivision）

## 数据结构与类型
- NoteEvent 扩展：`{ stringIndex?: number, fret?: number, cents?: number, beat?: {bar, beat, sub}, ... }`
- AI 返回：`AnalysisResult` 增加 `claudeSummary: string` 与 `metrics`

## 性能与稳定性
- 复用单例 AudioContext（HMR/组件重挂载时不重复创建）
- 清理顺序：停止 tracks → 断开 nodes → 在 `state!=='closed'` 时关闭 Context（已修正 InvalidStateError）
- 低延迟：FFT + 自相关阈值调优，且滤波以稳定识别

## 验证与测试
- 单元测试：音名→弦品映射（边界 E2/E4、半音、容差）
- 端到端：录音→AI 分析→结果面板；风格/Key 切换；节拍器同步
- 预览：本地 http://localhost:3000/ 打开，手动弹奏验证格子高亮与节拍同步

## 交付
- Edge Function 代码与部署
- 前端调用链与 UI 更新（Style/Key/Tempo 控制、结果面板）
- 文档：如何使用、权限提示、常见问题（麦克风权限、输入增益、耳机监听）

请确认以上方案，我将开始实现（后端函数 + 前端调用 + 实时定位 + 音阶映射 + 节拍器）。