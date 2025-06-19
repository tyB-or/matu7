#!/bin/bash

# 获取脚本所在目录-之前在manread下
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 检查可执行文件是否存在
if [ ! -f "$SCRIPT_DIR/extend/manReader/manreader" ]; then
    echo "正在编译 manReader..."
    cd "$SCRIPT_DIR/extend/manReader" && go build -o manreader
    
    if [ $? -ne 0 ]; then
        echo "编译失败，请确保已安装 Go 环境。"
        exit 1
    fi
    
    echo "编译成功！"
fi

# 确保离线工具目录存在
OFFLINE_TOOLS_DIR="$SCRIPT_DIR/notes/offline_tools"
if [ ! -d "$OFFLINE_TOOLS_DIR" ]; then
    echo "首次运行，正在初始化..."
    mkdir -p "$OFFLINE_TOOLS_DIR"
    "$SCRIPT_DIR/extend/manReader/manreader" -init
fi

# 处理命令行参数
if [ "$1" == "list" ] || [ "$1" == "-list" ] || [ "$1" == "--list" ]; then
    # 列出所有手册
    "$SCRIPT_DIR/extend/manReader/manreader" -list
    exit 0
fi

# 如果没有参数或者第一个参数是帮助选项，显示使用方法
if [ $# -eq 0 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ] || [ "$1" == "help" ]; then
    echo "Matu7 ManReader - 命令手册彩色阅读器"
    echo ""
    echo "使用方法:"
    echo "  ./run.sh <手册名称>         查看指定的命令手册"
    echo "  ./run.sh list              列出所有可用的命令手册"
    echo "  ./run.sh -file <文件路径>   查看指定路径的文本文件"
    echo "  ./run.sh help              显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./run.sh git               查看Git命令手册"
    echo "  ./run.sh -file ~/notes.txt 查看指定的文本文件"
    echo ""
    echo "手册文件存储在: $OFFLINE_TOOLS_DIR"
    exit 0
fi

# 处理 -file 参数
if [ "$1" == "-file" ] && [ $# -ge 2 ]; then
    "$SCRIPT_DIR/extend/manReader/manreader" -file "$2"
    exit 0
fi

# 处理手册名称参数
MANUAL_NAME="$1"
if [[ ! "$MANUAL_NAME" == *.txt ]]; then
    MANUAL_NAME="${MANUAL_NAME}.txt"
fi

MANUAL_PATH="$OFFLINE_TOOLS_DIR/$MANUAL_NAME"

# 检查手册是否存在
if [ ! -f "$MANUAL_PATH" ]; then
    echo "错误: 找不到手册文件 '$MANUAL_NAME'"
    echo "可用的手册列表:"
    "$SCRIPT_DIR/extend/manReader/manreader" -list
    exit 1
fi

# 查看手册
"$SCRIPT_DIR/extend/manReader/manreader" -file "$MANUAL_PATH" 