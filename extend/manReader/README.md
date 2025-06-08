# manReader - 命令行手册阅读器

`manReader` 是一个简单的命令行工具，用于格式化和显示文本格式的命令手册。它旨在提供一种比纯文本更易读、更美观的手册查看体验。

## 特性

*   **彩色高亮:** 使用 ANSI 颜色代码美化手册内容，区分标题、命令、示例、描述和章节。
*   **Markdown 风格解析:** 支持简单的 Markdown 标记来定义手册结构：
    *   `# 章节标题`
    *   `## 子标题`
    *   \`\`\` 用于代码块切换
    *   `- 列表项`
*   **Matu7 集成 (推测):** 包含初始化逻辑 (`-init`)，用于创建存放手册文件的目录 (`../../notes/offline_tools`)，方便与其他工具 (如 Matu7) 集成。
*   **手册列表:** 通过 `-list` 命令可以方便地查看所有可用的手册。
*   **跨平台:** 核心功能可在 Windows, macOS 和 Linux 上运行 (需要 Go 环境编译)。

## 安装 / 构建

确保您已安装 Go 语言环境 (推荐版本 1.18 或更高)。

在 `manReader` 源代码目录下（即包含 `main.go` 和 `go.mod` 的目录）运行以下命令进行编译：

```bash
go build -o manread_compiled
```

这将在当前目录下生成名为 `manread_compiled` (Linux/macOS) 或 `manread_compiled.exe` (Windows) 的可执行文件。

## 用法

```
manread_compiled [标志]
```

**可用标志:**

*   `-init` : 初始化 `manReader`。这通常只需要运行一次。它会尝试在 `manread_compiled` 可执行文件所在位置的上两级目录中创建 `notes/offline_tools` 目录，用于存放手册文件。
    ```bash
    ./manread_compiled -init
    ```

*   `-list` : 列出 `notes/offline_tools` 目录中所有可用的 `.txt` 手册文件。
    ```bash
    ./manread_compiled -list
    ```

*   `-file <文件路径>` : 读取、格式化并显示指定路径的 `.txt` 手册文件。
    ```bash
    ./manread_compiled -file ../../notes/offline_tools/your_command.txt
    # 或者使用绝对路径
    ./manread_compiled -file /path/to/your/manual/file.txt
    ```

*   `-h` 或 `--help` : 显示帮助信息 (由 Go `flag` 包提供)。

**首次使用:**

建议先运行 `-init` 来创建手册目录。

```bash
./manread_compiled -init
```

然后将您的 `.txt` 格式的手册文件放入 `notes/offline_tools` 目录中。

**查看手册:**

```bash
# 列出可用手册
./manread_compiled -list

# 查看名为 'git' 的手册 (假设存在 git.txt)
./manread_compiled -file ../../notes/offline_tools/git.txt
```

## 手册文件格式 (.txt)

手册文件应为纯文本 (`.txt`) 文件，并遵循以下简单的 Markdown 风格约定：

```text
# 命令或主题名称 (会被用作主标题)

# 简介 (章节标题)
这里是关于命令的简要介绍。

## 语法 (子标题)
command [options] <arguments>

# 常用选项 (章节标题)
- `-h, --help`: 显示帮助信息。
- `-v, --version`: 显示版本号。

# 示例 (章节标题)
显示如何使用该命令。

## 基本用法 (子标题)
```bash
command subcommand --flag value
```
上面的代码块会被高亮显示。

## 进阶用法 (子标题)
更复杂的示例。
```

*   **章节标题:** 以 `# ` 开头 (井号后有一个空格)。
*   **子标题:** 以 `## ` 开头 (两个井号后有一个空格)。
*   **代码块:** 使用三个反引号 ` ``` ` 开始和结束代码块。代码块内的内容会以特定颜色显示。
*   **列表项:** 以 `- ` 开头 (减号后有一个空格)。
*   **普通文本:** 其他所有行都将被视为普通描述文本。
*   **空行:** 用于分隔段落，增加可读性。

## 集成 (integrate.go)

`integrate.go` 文件包含了一些辅助函数，旨在方便地将 `manReader` 集成到其他 Go 程序中（例如 Matu7）。

*   `IntegrateWithMatu7()`: 执行初始化逻辑，创建 `offline_tools` 目录。
*   `ListManuals()`: 返回 `offline_tools` 目录中的 `.txt` 文件列表。
*   `ViewManual(manualPath string)`: 通过调用 `manread_compiled` 可执行文件来显示指定的手册。
*   `CreateNewManual(name string)`: 在 `offline_tools` 目录中创建新的手册文件。
*   `DeleteManual(name string)`: 从 `offline_tools` 目录中删除手册文件。

这些函数允许其他 Go 程序以编程方式与 `manReader` 的手册库进行交互。 