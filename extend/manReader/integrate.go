package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// 为Matu7创建工具集成函数
func IntegrateWithMatu7() {
	// 获取当前文件的绝对路径
	execPath, err := os.Executable()
	if err != nil {
		fmt.Printf("无法获取可执行文件路径: %v\n", err)
		return
	}

	// 获取可执行文件所在目录
	execDir := filepath.Dir(execPath)
	
	// 使用notes/offline_tools目录用于存储命令手册
	// 根据操作系统设置合适的路径分隔符
	offlineToolsDir := filepath.Join(execDir, "..", "..", "notes", "offline_tools")
	// 标准化路径,确保跨平台兼容
	offlineToolsDir = filepath.Clean(offlineToolsDir)
	
	// 设置合适的目录权限
	var dirMode os.FileMode
	if runtime.GOOS == "windows" {
		dirMode = 0666
	} else {
		dirMode = 0755
	}
	
	if _, err := os.Stat(offlineToolsDir); os.IsNotExist(err) {
		err = os.MkdirAll(offlineToolsDir, dirMode)
		if err != nil {
			fmt.Printf("无法创建offline_tools目录: %v\n", err)
			return
		}
	}
	
	// 复制示例文件到offline_tools目录
	// copyExampleFiles(execDir, offlineToolsDir)
	
	fmt.Println("ManReader已成功集成到Matu系统！")
	fmt.Printf("命令手册目录: %s\n", offlineToolsDir)
	fmt.Println("您可以在此目录中添加更多的命令手册文件。")
}

// 复制示例文件到offline_tools目录
func copyExampleFiles(srcDir, destDir string) {
	exampleFiles := []string{"example.txt", "docker.txt"}
	
	for _, file := range exampleFiles {
		srcPath := filepath.Join(srcDir, file)
		destPath := filepath.Join(destDir, file)
		
		// 检查源文件是否存在
		if _, err := os.Stat(srcPath); os.IsNotExist(err) {
			fmt.Printf("源文件不存在: %s，跳过复制\n", srcPath)
			continue
		}
		
		// 读取源文件内容
		content, err := os.ReadFile(srcPath)
		if err != nil {
			fmt.Printf("无法读取文件 %s: %v\n", srcPath, err)
			continue
		}
		
		// 写入目标文件
		err = os.WriteFile(destPath, content, 0644)
		if err != nil {
			fmt.Printf("无法写入文件 %s: %v\n", destPath, err)
			continue
		}
		
		fmt.Printf("已复制示例文件: %s\n", file)
	}
}

// ViewManual 查看手册文件
func ViewManual(manualPath string) error {
	// 检查文件是否存在
	if _, err := os.Stat(manualPath); os.IsNotExist(err) {
		return fmt.Errorf("手册文件不存在: %s", manualPath)
	}
	
	// 获取可执行文件路径
	execPath, err := getManReaderExecutable()
	if err != nil {
		return fmt.Errorf("无法找到manread可执行文件: %v", err)
	}
	
	// 构建命令
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", execPath, "-file", manualPath)
	case "darwin":
		cmd = exec.Command(execPath, "-file", manualPath)
	case "linux":
		cmd = exec.Command(execPath, "-file", manualPath)
	default:
		cmd = exec.Command(execPath, "-file", manualPath)
	}
	
	// 设置输入输出
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	
	// 执行命令
	return cmd.Run()
}

// getManReaderExecutable 获取manReader可执行文件路径
func getManReaderExecutable() (string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("无法获取可执行文件路径: %v", err)
	}
	
	// 确定manreader可执行文件名
	manReaderName := "manread"
	if runtime.GOOS == "windows" {
		manReaderName = "manread.exe"
	}
	
	// 先尝试在当前目录查找
	currentDirPath := filepath.Join(filepath.Dir(execPath), manReaderName)
	if _, err := os.Stat(currentDirPath); err == nil {
		return currentDirPath, nil
	}
	
	// 再尝试在上级目录查找
	parentDirPath := filepath.Join(filepath.Dir(execPath), "..", manReaderName)
	if _, err := os.Stat(parentDirPath); err == nil {
		return parentDirPath, nil
	}
	
	// 最后尝试在PATH中查找
	path, err := exec.LookPath(manReaderName)
	if err == nil {
		return path, nil
	}
	
	return "", fmt.Errorf("未找到manreader可执行文件")
}

// 以下是一些辅助函数，可以根据需要集成到Matu7系统中

// ListManuals 列出offline_tools目录中的所有手册文件
func ListManuals() ([]string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return nil, fmt.Errorf("无法获取可执行文件路径: %v", err)
	}
	
	offlineToolsDir := filepath.Join(filepath.Dir(execPath), "..", "..", "notes", "offline_tools")
	if _, err := os.Stat(offlineToolsDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("offline_tools目录不存在")
	}
	
	// 读取目录内容
	entries, err := os.ReadDir(offlineToolsDir)
	if err != nil {
		return nil, fmt.Errorf("无法读取offline_tools目录: %v", err)
	}
	
	// 提取txt文件
	var manuals []string
	for _, entry := range entries {
		if !entry.IsDir() && filepath.Ext(entry.Name()) == ".txt" {
			manuals = append(manuals, entry.Name())
		}
	}
	
	return manuals, nil
}

// CreateNewManual 在offline_tools目录创建新的手册文件
func CreateNewManual(name string) (string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("无法获取可执行文件路径: %v", err)
	}
	
	offlineToolsDir := filepath.Join(filepath.Dir(execPath), "..", "..", "notes", "offline_tools")
	if _, err := os.Stat(offlineToolsDir); os.IsNotExist(err) {
		err = os.MkdirAll(offlineToolsDir, 0755)
		if err != nil {
			return "", fmt.Errorf("无法创建offline_tools目录: %v", err)
		}
	}
	
	// 确保文件名以.txt结尾
	if filepath.Ext(name) != ".txt" {
		name += ".txt"
	}
	
	manualPath := filepath.Join(offlineToolsDir, name)
	
	// 创建新文件
	f, err := os.Create(manualPath)
	if err != nil {
		return "", fmt.Errorf("无法创建手册文件: %v", err)
	}
	defer f.Close()
	
	// 写入模板内容
	template := "# " + strings.TrimSuffix(name, ".txt") + "\n\n这是一个新的命令手册文件。\n\n## 使用方法\n\n在这里添加使用说明...\n\n## 常用命令\n\n```\n# 在这里添加命令示例\n```\n"
	_, err = f.WriteString(template)
	if err != nil {
		return "", fmt.Errorf("无法写入模板内容: %v", err)
	}
	
	return manualPath, nil
} 