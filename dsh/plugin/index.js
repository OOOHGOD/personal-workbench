// @local/dsh-personal-workbench — Host tool plugin for the personal workbench.
// Registers workbench_* tools over one master copy: <dataDir>/records.jsonl
import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export const inject = ['tools']

const TAGS = ['work', 'study', 'apply', 'resume']
const STATUSES = ['todo', 'doing', 'done', 'blocked']

const text = (t) => [{ type: 'text', text: String(t) }]
const jsonOut = () => ({ schema: { type: 'object' }, render: (_a, v) => text(JSON.stringify(v, null, 2)) })

function nowISO() { return new Date().toISOString() }
function norm(s) { return String(s ?? '').trim().replace(/\s+/g, ' ') }
function day(s) { return String(s ?? '').slice(0, 10) }

export function apply(ctx, config = {}) {
  const dataDir = config.dataDir || join(homedir(), 'workbench')
  const recordsPath = join(dataDir, 'records.jsonl')
  const snapshotsDir = join(dataDir, 'snapshots')

  const ensure = async () => {
    await fs.mkdir(dataDir, { recursive: true })
    await fs.mkdir(snapshotsDir, { recursive: true })
  }

  const readRecords = async () => {
    try {
      const raw = await fs.readFile(recordsPath, 'utf8')
      return raw.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l))
    } catch (e) {
      if (e && e.code === 'ENOENT') return []
      throw e
    }
  }

  const writeRecords = async (records) => {
    await ensure()
    await fs.writeFile(recordsPath, records.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8')
  }

  const cleanTags = (tags) => [...new Set(Array.isArray(tags) ? tags : [])].filter((t) => TAGS.includes(t))

  const disposers = []

  // ── workbench_record ────────────────────────────────────────────────
  disposers.push(ctx.tools.register({
    name: 'workbench_record',
    description:
      '记一条工作台记录：一句话事实 + 可选用途标记(tags: work/study/apply/resume，可多个)。自动去重（同一内容只存一份，重复时合并用途标记）。不设“分类”字段。',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '要记下的事实/事项，一句话。' },
        tags: { type: 'array', items: { type: 'string', enum: TAGS }, description: '用途标记，可多个：work=工作 study=学习 apply=申请 resume=简历证据。' },
        status: { type: 'string', enum: STATUSES, description: '状态（主要给 work/apply）。默认 todo。' },
        deadline: { type: 'string', description: '截止日 YYYY-MM-DD（主要给 apply）。' },
        source: { type: 'string', description: '来源溯源（可选）：codex / workbuddy / orca / 手动。' },
      },
      required: ['content'],
    },
    output: jsonOut(),
    async execute(args) {
      const content = norm(args.content)
      if (!content) throw new Error('content 不能为空')
      const tags = cleanTags(args.tags)
      const records = await readRecords()
      const hit = records.find((r) => norm(r.content) === content)
      let record
      if (hit) {
        hit.tags = [...new Set([...(hit.tags || []), ...tags])]
        if (args.status) hit.status = args.status
        if (args.deadline) hit.deadline = args.deadline
        if (args.source) hit.source = args.source
        hit.updated_at = nowISO()
        await writeRecords(records)
        record = hit
        return { action: 'merged', note: '已存在相同内容，合并用途标记，未重复记录', record }
      }
      record = {
        id: 'rec_' + randomUUID().replace(/-/g, '').slice(0, 16),
        content,
        tags,
        status: args.status || 'todo',
        deadline: args.deadline || null,
        source: args.source || null,
        created_at: nowISO(),
        updated_at: nowISO(),
      }
      await ensure()
      await fs.appendFile(recordsPath, JSON.stringify(record) + '\n', 'utf8')
      return { action: 'created', record }
    },
  }))

  // ── workbench_list ──────────────────────────────────────────────────
  disposers.push(ctx.tools.register({
    name: 'workbench_list',
    description: '筛选工作台记录：按用途标记、状态、截止日、关键词、日期范围筛选。',
    parameters: {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string', enum: TAGS }, description: '用途标记（可多个，取并集）。' },
        status: { type: 'string', enum: STATUSES },
        keyword: { type: 'string', description: '内容关键词（子串匹配）。' },
        deadline_from: { type: 'string', description: '截止日 >= YYYY-MM-DD。' },
        deadline_to: { type: 'string', description: '截止日 <= YYYY-MM-DD。' },
        since: { type: 'string', description: '创建时间 >= YYYY-MM-DD。' },
        until: { type: 'string', description: '创建时间 <= YYYY-MM-DD。' },
        limit: { type: 'integer', description: '最多返回条数，默认 50。' },
      },
    },
    output: jsonOut(),
    async execute(args) {
      let records = await readRecords()
      if (args.tags && args.tags.length) records = records.filter((r) => args.tags.some((t) => (r.tags || []).includes(t)))
      if (args.status) records = records.filter((r) => r.status === args.status)
      if (args.keyword) records = records.filter((r) => (r.content || '').includes(args.keyword))
      if (args.deadline_from) records = records.filter((r) => r.deadline && r.deadline >= args.deadline_from)
      if (args.deadline_to) records = records.filter((r) => r.deadline && r.deadline <= args.deadline_to)
      if (args.since) records = records.filter((r) => day(r.created_at) >= args.since)
      if (args.until) records = records.filter((r) => day(r.created_at) <= args.until)
      const limit = Math.min(args.limit || 50, 500)
      return { count: records.slice(0, limit).length, total: records.length, records: records.slice(0, limit) }
    },
  }))

  // ── workbench_daily ─────────────────────────────────────────────────
  disposers.push(ctx.tools.register({
    name: 'workbench_daily',
    description: '生成当日两版日报：自用版（全含）与领导摘要（不含 study/resume 标记的记录）。',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: '日期 YYYY-MM-DD，默认今天。' },
      },
    },
    output: jsonOut(),
    async execute(args) {
      const date = args.date || day(nowISO())
      const records = await readRecords()
      const dayRecs = records.filter((r) => day(r.created_at) === date)
      const leader = dayRecs.filter((r) => !(r.tags || []).some((t) => t === 'study' || t === 'resume'))
      return {
        date,
        self_version: { label: '自用版（全含）', count: dayRecs.length, items: dayRecs },
        leader_version: { label: '领导摘要（不含学习/简历证据）', count: leader.length, items: leader },
      }
    },
  }))

  // ── workbench_evidence ──────────────────────────────────────────────
  disposers.push(ctx.tools.register({
    name: 'workbench_evidence',
    description: '生成月初「证据清单 + 按用途标记分组的证据段落」。只出清单/段落，不生成完整简历文件、不改写简历。',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'string', description: '月份 YYYY-MM，默认上月。' },
      },
    },
    output: jsonOut(),
    async execute(args) {
      let month = args.month
      if (!month) {
        const d = new Date()
        const y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear()
        const m = d.getMonth() === 0 ? 12 : d.getMonth()
        month = `${y}-${String(m).padStart(2, '0')}`
      }
      const records = await readRecords()
      const evidence = records.filter((r) => (r.tags || []).includes('resume') && day(r.created_at).slice(0, 7) === month)
      const grouped = {}
      for (const r of evidence) {
        for (const t of r.tags || []) {
          ;(grouped[t] = grouped[t] || []).push({ id: r.id, content: r.content, date: day(r.created_at) })
        }
      }
      return {
        month,
        evidence_count: evidence.length,
        evidence_list: evidence.map((r) => ({ id: r.id, content: r.content, tags: r.tags, date: day(r.created_at) })),
        grouped_by_tag: grouped,
      }
    },
  }))

  // ── workbench_deadlines ─────────────────────────────────────────────
  disposers.push(ctx.tools.register({
    name: 'workbench_deadlines',
    description: '列出截止日临近（默认 14 天内）且未完成（status != done）的记录，按倒计时分级 ≤3 / ≤7 / ≤14 天。',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: '提前窗口天数，默认 14。' },
        today: { type: 'string', description: '基准日期 YYYY-MM-DD，默认今天。' },
      },
    },
    output: jsonOut(),
    async execute(args) {
      const days = args.days || 14
      const today = args.today || day(nowISO())
      const now = new Date(today + 'T00:00:00')
      const records = await readRecords()
      const upcoming = records
        .filter((r) => r.deadline && r.status !== 'done')
        .map((r) => {
          const diff = Math.round((new Date(r.deadline + 'T00:00:00') - now) / 86400000)
          return { id: r.id, content: r.content, tags: r.tags, status: r.status, deadline: r.deadline, days_left: diff }
        })
        .filter((r) => r.days_left >= 0 && r.days_left <= days)
        .sort((a, b) => a.days_left - b.days_left)
      const t3 = upcoming.filter((r) => r.days_left <= 3)
      const t7 = upcoming.filter((r) => r.days_left > 3 && r.days_left <= 7)
      const t14 = upcoming.filter((r) => r.days_left > 7)
      return { today, window_days: days, total: upcoming.length, tiers: { '≤3天': t3, '≤7天': t7, '≤14天': t14 } }
    },
  }))

  // ── workbench_snapshot ──────────────────────────────────────────────
  disposers.push(ctx.tools.register({
    name: 'workbench_snapshot',
    description: '产出全量快照（开放格式 JSON）到 snapshots/，并做一次恢复演练（读回校验条数）。',
    parameters: { type: 'object', properties: {} },
    output: jsonOut(),
    async execute() {
      await ensure()
      const records = await readRecords()
      const stamp = nowISO().replace(/[:.]/g, '-')
      const file = join(snapshotsDir, `snapshot-${stamp}.json`)
      await fs.writeFile(file, JSON.stringify({ exported_at: nowISO(), count: records.length, records }, null, 2), 'utf8')
      const back = JSON.parse(await fs.readFile(file, 'utf8'))
      const ok = Array.isArray(back.records) && back.records.length === records.length
      return { snapshot_path: file, exported_count: records.length, restore_drill: ok ? 'passed' : 'failed', read_back_count: back.records.length }
    },
  }))

  // ── workbench_ingest ────────────────────────────────────────────────
  disposers.push(ctx.tools.register({
    name: 'workbench_ingest',
    description: '读取外部工具（Codex / Workbuddy / Orca）的工作记录原始内容，供整理成工作日志。只读，不修改来源文件。',
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['codex', 'workbuddy', 'orca', 'all'], description: '来源：codex=会话索引，workbuddy=memory 记忆文件，orca=bot 记忆，all=全部。' },
        since: { type: 'string', description: '仅返回该日期(YYYY-MM-DD)之后的内容（主要对 codex 生效）。' },
      },
      required: ['source'],
    },
    output: jsonOut(),
    async execute(args) {
      const since = args.since ? new Date(args.since + 'T00:00:00') : null
      const home = homedir()
      const out = []
      const readText = async (p) => {
        try { return await fs.readFile(p, 'utf8') } catch (e) { if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return null; throw e }
      }

      if (args.source === 'codex' || args.source === 'all') {
        const idx = await readText(join(home, '.codex', 'session_index.jsonl'))
        if (idx) {
          const lines = idx.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
          const recent = lines.filter((l) => !since || new Date(l.updated_at) >= since).slice(0, 60)
          out.push('## Codex 会话索引（最近 ' + recent.length + ' 条）\n' + recent.map((l) => '- [' + String(l.updated_at).slice(0, 10) + '] ' + l.thread_name).join('\n'))
        } else {
          out.push('## Codex\n（无 session_index.jsonl）')
        }
        const memSum = await readText(join(home, '.codex', 'memories_v2', 'memory_summary.md'))
        if (memSum) out.push('## Codex 记忆摘要 memory_summary.md\n' + memSum.slice(0, 8000))
        const rsDir = join(home, '.codex', 'memories_v2', 'rollout_summaries')
        let rs = []
        try { rs = await fs.readdir(rsDir) } catch {}
        for (const f of rs.filter((f) => f.endsWith('.md')).sort().slice(0, 5)) {
          const t = await readText(join(rsDir, f))
          if (t) out.push('## Codex rollout 摘要 ' + f + '\n' + t.slice(0, 3000))
        }
        try {
          const { DatabaseSync } = await import('node:sqlite')
          const db = new DatabaseSync(join(home, '.codex', 'thread_history_1.sqlite'), { readOnly: true })
          try {
            const sinceMs = since ? since.getTime() : 0
            const rows = db.prepare("SELECT item_type, item_json FROM thread_items WHERE item_type IN ('userMessage','agentMessage') AND created_at_ms >= ? ORDER BY created_at_ms DESC LIMIT 40").all(sinceMs)
            const msgs = []
            for (const r of rows) {
              let txt = null
              try { txt = JSON.parse(r.item_json).text } catch {}
              if (txt) msgs.push((r.item_type === 'userMessage' ? '【问】' : '【答】') + ' ' + String(txt).slice(0, 300))
            }
            if (msgs.length) out.push('## Codex 最近对话（' + msgs.length + ' 条）\n' + msgs.join('\n').slice(0, 8000))
          } finally { db.close() }
        } catch (e) {
          // node:sqlite 不可用或库被锁时跳过聊天正文，仅保留索引与记忆摘要
        }
      }

      if (args.source === 'workbuddy' || args.source === 'all') {
        const dir = join(home, '.workbuddy', 'memory')
        let files = []
        try { files = await fs.readdir(dir) } catch {}
        const mds = files.filter((f) => f.endsWith('.md')).sort().slice(0, 3)
        for (const f of mds) {
          const txt = await readText(join(dir, f))
          if (txt) out.push('## Workbuddy memory: ' + f + '\n' + txt.slice(0, 8000))
        }
        if (!mds.length) out.push('## Workbuddy\n（无 memory 文件）')
      }

      if (args.source === 'orca' || args.source === 'all') {
        const bots = join(home, '.orca', 'bots')
        let names = []
        try { names = await fs.readdir(bots) } catch {}
        let found = false
        for (const b of names) {
          const mem = await readText(join(bots, b, 'MEMORY.md'))
          if (mem) { out.push('## Orca bot ' + b + ' MEMORY.md\n' + mem.slice(0, 4000)); found = true }
          const memDir = join(bots, b, 'memory')
          let tf = []
          try { tf = await fs.readdir(memDir) } catch {}
          for (const f of tf) {
            const t = await readText(join(memDir, f))
            if (t) { out.push('## Orca bot ' + b + ' memory/' + f + '\n' + t.slice(0, 4000)); found = true }
          }
        }
        if (!found) out.push('## Orca\n（暂无 bot 记忆内容）')
      }

      return { source: args.source, since: args.since || null, content: out.join('\n\n').slice(0, 30000) }
    },
  }))

  return () => { for (const d of disposers) d() }
}
