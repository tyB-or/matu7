package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ANSI颜色代码
const (
	Reset      = "\033[0m"
	Bold       = "\033[1m"
	Italic     = "\033[3m"
	Underline  = "\033[4m"
	Black      = "\033[30m"
	Red        = "\033[31m"
	Green      = "\033[32m"
	Yellow     = "\033[33m"
	Blue       = "\033[34m"
	Magenta    = "\033[35m"
	Cyan       = "\033[36m"
	White      = "\033[37m"
	BgBlack    = "\033[40m"
	BgRed      = "\033[41m"
	BgGreen    = "\033[42m"
	BgYellow   = "\033[43m"
	BgBlue     = "\033[44m"
	BgMagenta  = "\033[45m"
	BgCyan     = "\033[46m"
	BgWhite    = "\033[47m"
)

// 命令格式化配置
type CommandFormat struct {
	TitleColor    string
	CommandColor  string
	ExampleColor  string
	DescColor     string
	SectionColor  string
	BorderColor   string
	HeaderBgColor string
}

// 默认格式化配置
var defaultFormat = CommandFormat{
	TitleColor:    Bold + Cyan,
	CommandColor:  Bold + Yellow,
	ExampleColor:  Green,
	DescColor:     White,
	SectionColor:  Bold + Magenta,
	BorderColor:   Blue,
	HeaderBgColor: BgBlue,
}

func main() {
	// 命令行参数
	filePath := flag.String("file", "", "要读取的文本文件路径")
	initialize := flag.Bool("init", false, "初始化ManReader并集成到Matu")
	list := flag.Bool("list", false, "列出所有可用的命令手册")
	flag.Parse()

	// 处理初始化请求
	if *initialize {
		IntegrateWithMatu7()
		return
	}

	// 列出所有手册
	if *list {
		manuals, err := ListManuals()
		if err != nil {
			fmt.Printf("%s错误：%s%v\n", Bold+Red, Reset, err)
			os.Exit(1)
		}

		fmt.Printf("%s可用的命令手册：%s\n\n", Bold+Cyan, Reset)
		for i, manual := range manuals {
			name := strings.TrimSuffix(manual, ".txt")
			fmt.Printf("%d. %s%s%s\n", i+1, Bold+Yellow, name, Reset)
		}
		return
	}

	// 校验参数
	if *filePath == "" {
		fmt.Printf("%s错误：%s请提供文件路径，使用 -file 参数指定\n", Bold+Red, Reset)
		fmt.Printf("使用示例: %smanReader -file /path/to/your/file.txt%s\n", Bold+Green, Reset)
		fmt.Printf("或者使用 %s-list%s 参数查看所有可用的命令手册\n", Bold+Green, Reset)
		fmt.Printf("初次使用请运行: %smanReader -init%s 进行初始化\n", Bold+Green, Reset)
		os.Exit(1)
	}

	// 检查文件是否存在
	absPath, err := filepath.Abs(*filePath)
	if err != nil {
		fmt.Printf("%s错误：%s无法解析文件路径: %v\n", Bold+Red, Reset, err)
		os.Exit(1)
	}

	fileInfo, err := os.Stat(absPath)
	if err != nil {
		if os.IsNotExist(err) {
			fmt.Printf("%s错误：%s文件不存在: %s\n", Bold+Red, Reset, absPath)
		} else {
			fmt.Printf("%s错误：%s无法访问文件: %v\n", Bold+Red, Reset, err)
		}
		os.Exit(1)
	}

	if fileInfo.IsDir() {
		fmt.Printf("%s错误：%s指定的路径是一个目录，不是文件: %s\n", Bold+Red, Reset, absPath)
		os.Exit(1)
	}

	// 读取文件
	file, err := os.Open(absPath)
	if err != nil {
		fmt.Printf("%s错误：%s无法打开文件: %v\n", Bold+Red, Reset, err)
		os.Exit(1)
	}
	defer file.Close()

	// 提取文件名作为标题
	fileName := filepath.Base(absPath)
	title := strings.TrimSuffix(fileName, filepath.Ext(fileName))

	// 打印标题和文件信息
	printHeader(title, absPath, fileInfo)

	// 解析并打印文件内容
	scanner := bufio.NewScanner(file)
	parseAndPrintContent(scanner)

	// 打印页脚
	printFooter()
}

// 打印文件头部信息
func printHeader(title, path string, fileInfo os.FileInfo) {
	// 获取控制台宽度
	width := 80

	// 创建边框
	border := strings.Repeat("=", width)
	fmt.Printf("%s%s%s\n", defaultFormat.BorderColor, border, Reset)

	// 标题居中
	title = strings.ToUpper(title) + " 命令手册"
	padding := (width - len([]rune(title))) / 2
	if padding < 0 {
		padding = 0
	}
	titleLine := strings.Repeat(" ", padding) + title
	fmt.Printf("%s%s%s%s\n", defaultFormat.HeaderBgColor, defaultFormat.TitleColor, titleLine, Reset)

	// 文件信息
	fmt.Printf("%s文件路径: %s%s%s\n", defaultFormat.DescColor, Reset, defaultFormat.CommandColor, path)
	fmt.Printf("%s文件大小: %s%s%.2f KB%s\n", defaultFormat.DescColor, Reset, defaultFormat.CommandColor, float64(fileInfo.Size())/1024, Reset)
	fmt.Printf("%s最后修改: %s%s%s%s\n", defaultFormat.DescColor, Reset, defaultFormat.CommandColor, fileInfo.ModTime().Format("2006-01-02 15:04:05"), Reset)

	fmt.Printf("%s%s%s\n", defaultFormat.BorderColor, border, Reset)
	fmt.Println()
}

// 解析并打印文件内容
func parseAndPrintContent(scanner *bufio.Scanner) {
	var inCodeBlock bool
	var currentSection string

	for scanner.Scan() {
		line := scanner.Text()

		// 检查是否为标题行（使用 # 开头）
		if strings.HasPrefix(line, "# ") {
			currentSection = strings.TrimPrefix(line, "# ")
			fmt.Printf("\n%s%s【%s】%s\n\n", defaultFormat.SectionColor, Bold, currentSection, Reset)
			continue
		}

		// 检查是否为二级标题（使用 ## 开头）
		if strings.HasPrefix(line, "## ") {
			subTitle := strings.TrimPrefix(line, "## ")
			fmt.Printf("%s%s%s%s\n", defaultFormat.CommandColor, Bold, subTitle, Reset)
			continue
		}

		// 代码块处理
		if strings.HasPrefix(line, "```") {
			inCodeBlock = !inCodeBlock
			continue
		}

		// 在代码块内
		if inCodeBlock {
			fmt.Printf("  %s%s%s\n", defaultFormat.ExampleColor, line, Reset)
			continue
		}

		// 处理普通行
		if strings.TrimSpace(line) == "" {
			fmt.Println()
		} else if strings.HasPrefix(line, "- ") {
			// 列表项
			item := strings.TrimPrefix(line, "- ")
			fmt.Printf("  • %s%s%s\n", defaultFormat.DescColor, item, Reset)
		} else {
			// 普通文本
			fmt.Printf("%s%s%s\n", defaultFormat.DescColor, line, Reset)
		}
	}

	if err := scanner.Err(); err != nil {
		fmt.Printf("%s错误：%s读取文件时出错: %v\n", Bold+Red, Reset, err)
	}
}

// 打印页脚
func printFooter() {
	fmt.Println()
	width := 80
	border := strings.Repeat("-", width)
	fmt.Printf("%s%s%s\n", defaultFormat.BorderColor, border, Reset)
	
	now := time.Now().Format("2006-01-02 15:04:05")
	footer := fmt.Sprintf("由 manReader 工具生成于 %s", now)
	padding := (width - len([]rune(footer))) / 2
	if padding < 0 {
		padding = 0
	}
	
	footerLine := strings.Repeat(" ", padding) + footer
	fmt.Printf("%s%s%s\n", defaultFormat.DescColor, footerLine, Reset)
	fmt.Printf("%s%s%s\n", defaultFormat.BorderColor, border, Reset)
} 