# Matu7 - 本地工具管理系统



`Matu7` 是一个使用 Go 语言开发的本地工具管理系统。它旨在帮助开发者、安全研究人员和 IT 专业人士在一个统一的界面中组织、管理和使用他们的离线工具、网页工具和相关笔记。

该项目采用前后端分离架构，后端使用 Go (Gin 框架) 提供 API 服务，前端使用 HTML/CSS/JavaScript (位于 `matu7/public/`) 构建用户界面。通过本地 HTTP 服务器运行。

## 主要功能

*   **离线工具管理:**
    *   扫描指定目录以发现本地工具。
    *   自动识别工具类型和基本信息。
    *   通过标签对工具进行分类管理。
    *   直接从界面执行命令行工具。
    *   浏览工具相关的文件。
*   **网页工具管理:**
    *   收藏和管理常用的在线工具/网站链接。
    *   自动或手动为网站添加分类标签。
    *   快速打开收藏的网站。
*   **集成笔记系统:**
    *   为离线工具和网页工具添加说明、备忘录等笔记。
    *   灵活调整笔记面板。
*   **强大的搜索与过滤:**
    *   全文搜索快速定位工具和笔记。
    *   通过标签进行筛选。
*   **ManReader 工具集成:**
    *   内置 `manReader` (位于 `matu7/extend/manReader/`)，用于以美观的彩色格式显示文本命令手册 (`.txt` 文件)。
*   **离线优先 :**
    *   所有核心功能和数据均在本地运行和存储，无需互联网连接。
    *   适用于arm架构的mac
## 项目结构

```


├── config/            # 配置文件(自动生成)
├── extend/            # 扩展工具 (如 manReader)
├── notes/             # 笔记存储目录 (自动生成)
├── public/            # 前端静态文件 (HTML, CSS, JS)
│── README.md              # 本 README 文件

```

## 运行


### 运行

1.  **使用：参考视频**
    <div style="position:relative;padding-bottom:56.25%;width:100%;height:0;">
    <iframe src="https://player.bilibili.com/player.html?isOutside=true&amp;aid=113513032911164&bvid=BV1EcLizpEFa&cid=26851869069&amp;page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position:absolute;height:100%;width:100%;"></iframe></div>
   
2.  **首次运行配置:**
    程序启动后，会在终端打印日志。如果是首次运行且未配置工具扫描目录，它会提示您输入一个初始的根目录路径，用于存放您的离线工具。输入路径并按回车。如果目录不存在，会询问是否创建。

3.  **访问:**
    程序启动后，会监听 `http://localhost:58080` 并尝试自动在您的默认浏览器中打开此地址。您可以通过浏览器访问 Matu7 的管理界面。

4.  **命令参考:**
    open -a "TscanPlus_Mac_Arm64_v2.2.app"  
    java -jar webfinder-3.2.jar

    osascript -e 'tell application "Terminal" to activate' -e 'tell app "Terminal" to do script "cd /Users/chengsir/Downloads/infosec/网络监控/docker && /Users/chengsir/Downloads/matu_tool/read.sh docker"'

5. **打印笔记模板-格式：**

    ![image](https://github.com/user-attachments/assets/2dbbb04a-6d5f-4060-a388-9dfc4286efaa)



