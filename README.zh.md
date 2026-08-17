# dsh-session-rename

[English](README.md)

DeepSeek Harness Desktop 的“会话名称自定义”插件。

## 功能

- **点击当前对话顶部的会话名称**（或名称旁边的铅笔按钮）即可原地编辑标题：`Enter` 保存，`Escape` 取消；名称为空时给出明确提示，不会保存。
- 保存走的是内置的 `session.rename` 契约——与左侧历史列表原生“重命名”完全相同的路径——因此自定义名称会：
  - 同步显示在对话顶部、左侧历史列表以及其他所有展示会话名称的位置；
  - 以用户来源的 `session/title` 日志事件持久化（重启、切换会话后仍保留）；
  - **锁定**：手动重命名后，系统不会再用自动生成的名称覆盖它。
- 保留现有自动命名：从未手动改名的会话仍会根据第一句提示词自动命名（确定性回退 + 可选的 LLM 润色）。

## 绝不触碰

会话 type、对话模式（标准模式 / Think / Bash）、当前模型、Agent 执行逻辑、对话消息内容。重命名只是标题维度的日志事件，与上述任何一项都无关。

## 安装

```sh
dsh plugin --profile web add <本包路径>
```

然后把插入行加入 `$DSH_HOME/profiles/web/cordis.patch.yml`（或把本包加进 profile 的 `dsh.profile.bundles`，其 `cordis.patch.yml` 已含同样内容）：

```yaml
- insert:
    - id: ui-session-rename
      name: dsh-session-rename
```

之后重启桌面客户端（或 `dsh web`）。卸载：`dsh plugin --profile web remove dsh-session-rename` 并移除该行。

## 说明

- 左侧历史列表原生已支持重命名（行内 `...` 菜单 → 重命名）；本插件补上的是“对话顶部点击名称改名”这一入口，两者共用同一后端，天然同步。
- 标题文本由 Host 归一化（折叠空白、去除控制字符、按配置的 UTF-8 字节上限截断）。
