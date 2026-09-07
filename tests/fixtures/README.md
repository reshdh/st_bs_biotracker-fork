# Tracker prompt fixtures

`tracker_prompt_scenarios.mjs` 使用真实状态视图和提示词组装函数，覆盖日记、衣柜、心理、破水、幕外、代谢免疫、种族名录、优先角色、描述更新与六个尿意档位。

`tracker_prompt_baseline.json` 固定每个场景的段落顺序、可见工具、字符数和 SHA-256；另存默认与多功能场景的完整文本，便于直接审阅。基线生成于 TASK-16 段落装配重构前。结构重构须逐字一致；业务修复引起的差异要先解释，再定向更新对应场景，不能批量接受快照变化。

`tracker_prompt_contract.test.mjs` 同时检查 system 与 available_tools，防止工具描述中的唯一报数字段被删。断言只证明输入契约仍在，不代表真实模型触发率已验证。

TASK-16 后续修正：只有 `immune` 场景定向移除了 207 个字符的尿意按需段。该场景的状态视图没有尿意读数，原提示词却补成了 0；其余 21 份基线保持重构前内容。
