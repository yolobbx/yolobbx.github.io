---
title: "Mac 终端配置：从零到顺手"
date: 2026-05-28
author: yolobbx
category: tools
description: "拿到一台新 Mac 之后，我是怎么一层一层把终端配置成现在这样的：Homebrew、zsh、Oh My Zsh、Powerlevel10k、fzf、zoxide、eza、bat，最外层是 Ghostty。"
---

写这篇主要是给自己做记录。每次换电脑都要重新配一遍，每次都漏点东西，干脆写下来。

思路是**自底向上**：从一台干净的 Mac 开始，先搞包管理器，再搞 shell，再搞框架、插件、命令行工具，最后才是终端模拟器。每一层附上安装命令，复制即可用。

---

## 第 0 层：Homebrew

什么都没有的 Mac，先装 Homebrew。后面所有东西都靠它。

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

国内网络慢的话，我在 `~/.zprofile` 里加了阿里云镜像：

```bash
export HOMEBREW_PIP_INDEX_URL=http://mirrors.aliyun.com/pypi/simple
export HOMEBREW_API_DOMAIN=https://mirrors.aliyun.com/homebrew/homebrew-bottles/api
export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.aliyun.com/homebrew/homebrew-bottles
eval $(/opt/homebrew/bin/brew shellenv)
```

最后一行 `brew shellenv` 会把 `/opt/homebrew/bin` 塞进 `PATH`，Apple Silicon 必须有这一步，否则 `brew` 命令找不到。

---

## 第 1 层：Shell（zsh）

macOS 从 Catalina 开始默认就是 zsh，不需要装。直接编辑 `~/.zshrc` 加几行基础设置：

```bash
export LANG=en_US.UTF-8
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
HISTSIZE=50000
SAVEHIST=50000
setopt HIST_IGNORE_DUPS    # 重复命令不进历史
setopt SHARE_HISTORY       # 多个终端共享历史
setopt AUTO_CD             # 直接打目录名就 cd 过去
zstyle ':completion:*' matcher-list 'm:{a-z}=A-Z'   # 补全大小写不敏感
```

`SHARE_HISTORY` 比想象中重要：开多个终端窗口时，A 窗口刚跑过的命令在 B 窗口按 ↑ 也能拿到。

---

## 第 2 层：Oh My Zsh

zsh 原生功能其实够用，但 Oh My Zsh 提供了一套现成的 plugin / theme 机制，省得自己写。

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

装完它会自动改 `~/.zshrc`，把上面那些基础设置移到它生成的模板里。我用到的官方插件就这几个：

```bash
plugins=(
  git                  # gst/gco/gp 等 git 短命令
  sudo                 # 双击 ESC 自动给上一条命令加 sudo
  extract              # `x foo.tar.gz` 一键解压任何格式
  command-not-found    # 命令不存在时建议 brew 包
  macos                # cdf=切到 Finder 当前目录, tab=新标签
  colored-man-pages    # man 手册带颜色
)
```

`sudo` 这个最常用：忘了加 sudo 直接敲 ESC ESC，自动补上。`extract` 也好使，再不用记 `tar -xzvf` 还是 `-xjvf`。

---

## 第 3 层：主题（Powerlevel10k）

OMZ 自带很多主题，但都不如 p10k 好看且快。

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

然后 `~/.zshrc` 改：

```bash
ZSH_THEME="powerlevel10k/powerlevel10k"
```

第一次启动会跳交互式向导，挑图标、颜色、是否双行 prompt，最后生成 `~/.p10k.zsh`。配套要装一个 [Nerd Font](https://github.com/romkatv/powerlevel10k#manual-font-installation)，否则图标显示成方块。

p10k 还有个 instant prompt 特性，让 shell 启动时立刻显示提示符，源码加载在背后异步完成。这段必须放在 `.zshrc` 的**最顶部**：

```bash
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi
```

---

## 第 4 层：第三方 zsh 插件

OMZ 官方插件比较保守，真正每天用的两个体验提升来自社区：

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ~/.zsh/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting ~/.zsh/zsh-syntax-highlighting
```

在 `.zshrc` 里 source 它们：

```bash
source ~/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
```

- **zsh-autosuggestions**：基于历史的灰色补全，按 → 接受。
- **zsh-syntax-highlighting**：命令实时着色，命令存在才变绿，路径不存在直接红字提示。

注意顺序：**syntax-highlighting 必须放在最后**，否则它捕获不到后面 source 进来的命令。

---

## 第 5 层：命令行增强工具

到这一层 shell 已经够用了，下面这些是把日常体验拉满的小工具。

### fzf — 模糊查找一切

```bash
brew install fzf
```

```bash
source <(fzf --zsh)
```

装完三个快捷键就能用：

- `Ctrl-R` 模糊搜历史命令（这个一旦用上回不去）
- `Ctrl-T` 模糊选文件，自动塞到光标位置
- `Alt-C` 模糊 cd

### zoxide — 智能 cd

```bash
brew install zoxide
```

```bash
eval "$(zoxide init zsh)"
```

它记录你 cd 过的所有目录，按访问频率排。`z aris` 直接跳到 `~/ai/yolobbx.github.io`，不用记完整路径。

### eza — 现代版 ls

```bash
brew install eza
```

```bash
alias ls='eza --icons --git'
alias ll='eza -lah --icons --git --time-style=long-iso'
alias la='eza -a --icons'
alias lt='eza --tree --level=2 --icons'
```

带图标、带 git 状态、`lt` 直接看树形结构。

### bat — 现代版 cat

```bash
brew install bat
```

```bash
alias cat='bat --style=plain --paging=never'
alias catp='bat'   # 想要分页+行号时用 catp
```

这里有个细节：alias **只对交互 shell 生效**，脚本里写的 `cat` 还是系统 `cat`，不会因为这个 alias 出兼容问题。这是为什么我敢直接覆盖 `cat` 的原因。

### 其他小别名

```bash
alias gs='git status -sb'
alias gl='git log --oneline --graph --decorate -20'
```

OMZ 的 git 插件已经给了 `gst`、`gco`、`gp` 这些，再补两个我个人最常用的。

---

## 第 6 层：语言环境（Conda）

写 Python 必备，装 miniconda：

```bash
brew install --cask miniconda
conda init zsh
```

它会自动在 `.zshrc` 末尾插一段 `conda initialize` 块，不要手动改。

```bash
__conda_setup="$('/Users/yolo/miniconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/Users/yolo/miniconda3/etc/profile.d/conda.sh" ]; then
        . "/Users/yolo/miniconda3/etc/profile.d/conda.sh"
    fi
fi
unset __conda_setup
```

**一个常踩的坑**：网上很多教程会让你加这两行——

```bash
# alias pip="/usr/bin/pip3"
# alias python="/usr/bin/python3"
```

千万**不要**。加了之后 `conda activate myenv` 后 `python` 还是指向系统 `/usr/bin/python3`，env 形同虚设。这两行我专门注释掉留作警示。

---

## 第 7 层：终端模拟器（Ghostty）

到这里 shell 这一侧全部配完，最外层才是终端模拟器。我用的是 [Ghostty](https://ghostty.org/)，Mitchell Hashimoto（HashiCorp 创始人）写的，GPU 渲染、原生 macOS、配置文件够简单。

```bash
brew install --cask ghostty
```

配置在 `~/.config/ghostty/config`，编辑完 `Cmd+Shift+,` 重载。下面分块讲我的配置。

### 字体

```
font-family = "JetBrains Mono"
font-family = "Maple Mono NF CN"
font-size = 18
adjust-cell-height = 25%
font-feature = calt, cv01, cv03, ss01, ss02, ss03
font-thicken = true
```

写两次 `font-family` 是设主字体 + 中文回退。Maple Mono NF CN 是带 Nerd Font 图标的中文等宽字体，p10k 的图标和中文都靠它。`adjust-cell-height = 25%` 让行距更松，长时间看眼睛舒服很多。

### 主题与窗口

```
minimum-contrast = 3
theme = dracula

window-padding-x = 10
window-padding-y = 10
window-padding-balance = true
macos-titlebar-style = transparent
background-opacity = 0.95
background-blur-radius = 20
window-save-state = always
```

Dracula 主题 + 95% 不透明 + 模糊背景，配合 macOS 桌面能看到一点点壁纸，但又不影响读字。`minimum-contrast = 3` 强制最低对比度，防止某些主题下灰字看不清。`window-save-state = always` 重启后窗口位置和大小都恢复。

### 光标

```
cursor-style = block
cursor-style-blink = true
cursor-color = #ff9e64
cursor-text = #1a1b26
```

橙色 block 光标，深色背景下一眼能找到。

### 滚动与剪贴板

```
scrollback-limit = 100000
copy-on-select = clipboard
clipboard-paste-protection = true
```

滚动回看 10 万行（跑日志够用了），选中即复制，粘贴时如果有可疑控制字符会拦一下。

### Shell 集成

```
shell-integration = detect
shell-integration-features = cursor,sudo,title
```

打开后能用 `Cmd+↑/↓` 在不同 prompt 之间跳转，标签页标题自动跟着当前命令变。

### Quick Terminal（全局下拉终端）

```
quick-terminal-position = top
quick-terminal-animation-duration = 0.15
keybind = global:opt+grave_accent=toggle_quick_terminal
```

按 `Opt+\`` 从屏幕顶部下拉一个终端，再按一次收回去。临时跑一条命令完全不用切换窗口。第一次用会让你在系统设置里给辅助功能权限。

我没用 `Cmd+\``，因为它和很多 app 的"切换窗口"键冲突，`Opt+\`` 干净。

### 自定义键位

```
keybind = cmd+enter=toggle_fullscreen
keybind = cmd+r=clear_screen
```

`Cmd+Enter` 全屏，`Cmd+R` 清屏 + 清滚动缓冲（比 `clear` 命令彻底）。

---

## 完整配置文件

### `~/.zshrc`

```bash
# ═══════════════════════════════════════════════════════════════
#  ~/.zshrc  —  managed with care
# ═══════════════════════════════════════════════════════════════

# ── p10k instant prompt（必须放在文件最顶部，任何输出之前）
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# ── 基础环境
export LANG=en_US.UTF-8
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
HISTSIZE=50000
SAVEHIST=50000
setopt HIST_IGNORE_DUPS
setopt SHARE_HISTORY
setopt AUTO_CD
zstyle ':completion:*' matcher-list 'm:{a-z}=A-Z'

# ── Oh My Zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
zstyle ':omz:update' mode disabled

plugins=(
  git
  sudo
  extract
  command-not-found
  macos
  colored-man-pages
)

source $ZSH/oh-my-zsh.sh

# ── 第三方 zsh 插件（顺序：autosuggestions → syntax-highlighting 必须最后）
source ~/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# ── Powerlevel10k 用户配置
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# ── fzf / zoxide
source <(fzf --zsh)
eval "$(zoxide init zsh)"

# ── 别名
alias ls='eza --icons --git'
alias ll='eza -lah --icons --git --time-style=long-iso'
alias la='eza -a --icons'
alias lt='eza --tree --level=2 --icons'

alias cat='bat --style=plain --paging=never'
alias catp='bat'

alias gs='git status -sb'
alias gl='git log --oneline --graph --decorate -20'

# ── Conda
# >>> conda initialize >>>
__conda_setup="$('/Users/yolo/miniconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/Users/yolo/miniconda3/etc/profile.d/conda.sh" ]; then
        . "/Users/yolo/miniconda3/etc/profile.d/conda.sh"
    else
        export PATH="/Users/yolo/miniconda3/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<
```

### `~/.zprofile`

```bash
export HOMEBREW_PIP_INDEX_URL=http://mirrors.aliyun.com/pypi/simple
export HOMEBREW_API_DOMAIN=https://mirrors.aliyun.com/homebrew/homebrew-bottles/api
export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.aliyun.com/homebrew/homebrew-bottles
eval $(/opt/homebrew/bin/brew shellenv)
```

### `~/.config/ghostty/config`

```
# ===== Font =====
font-family = "JetBrains Mono"
font-family = "Maple Mono NF CN"
font-size = 18
adjust-cell-height = 25%
font-feature = calt, cv01, cv03, ss01, ss02, ss03
font-thicken = true

# ===== Theme =====
minimum-contrast = 3
theme = dracula

# ===== Window =====
window-padding-x = 10
window-padding-y = 10
window-padding-balance = true
macos-titlebar-style = transparent
background-opacity = 0.95
background-blur-radius = 20
window-save-state = always

# ===== Cursor =====
cursor-style = block
cursor-style-blink = true
cursor-color = #ff9e64
cursor-text = #1a1b26

# ===== Scrollback =====
scrollback-limit = 100000

# ===== Clipboard =====
copy-on-select = clipboard
clipboard-paste-protection = true

# ===== Shell integration =====
shell-integration = detect
shell-integration-features = cursor,sudo,title

# ===== Quick terminal =====
quick-terminal-position = top
quick-terminal-animation-duration = 0.15
keybind = global:opt+grave_accent=toggle_quick_terminal

# ===== Custom keybinds =====
keybind = cmd+enter=toggle_fullscreen
keybind = cmd+r=clear_screen
```

---

## 一键脚本（懒人版）

新机器上从头跑一遍：

```bash
# 1. Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval $(/opt/homebrew/bin/brew shellenv)

# 2. Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# 3. Powerlevel10k
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k

# 4. zsh 插件
git clone https://github.com/zsh-users/zsh-autosuggestions ~/.zsh/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting ~/.zsh/zsh-syntax-highlighting

# 5. 命令行工具
brew install fzf zoxide eza bat

# 6. 终端模拟器
brew install --cask ghostty

# 7. Conda
brew install --cask miniconda
conda init zsh
```

跑完之后把上面三个配置文件贴进去，重启 shell，p10k 会跳出向导让你挑样式，挑完就齐活了。

---

写下来发现这套栈分了 7 层但其实每层都很薄，关键是知道"哪一层负责什么"。下次配新机器照着这篇抄一遍，半小时能搞定。
