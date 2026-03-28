---
title: renlog
layout: default
---

# renlog

ターミナルで実行したコマンドの標準出力と標準エラー出力をあとから見返したくなることがよくあります。
たとえば、長いコマンドの出力を保存しておきたいときや、あとで「さっき何が出ていたっけ」と確認したいときです。

僕は4年ほど [zenlog](https://github.com/omakoto/zenlog) を使っていました。
便利だったのですが、細かい挙動を自分好みに調整したくなってきたので、Rust で作り直してみました。  
それが [renlog](https://github.com/akawashiro/renlog) です。

`renlog` を使うと、シェル上で実行した各コマンドの出力をログファイルに保存できます。
さらに、コマンド実行後にそのログファイルのパスが表示されるので、あとからすぐに開けます。

## インストール方法

```bash
cargo install renlog
```

でインストールして、`.bashrc` または `.zshrc` に以下の設定を書くと使えます。
この設定では、シェル起動時に renlog がシェルをラップし、その内側で実行されたコマンドごとの出力を保存します。

```bash
if which renlog > /dev/null 2>&1; then
    if [[ "$(ps -o comm= -p $PPID)" != "renlog" ]]; then
        renlog_dir=/tmp/renlog
        exec renlog --log-level info log --renlog-dir ${renlog_dir} --cmd 'bash -l'
    else
        eval "$(renlog show-bash-rc)"
    fi
fi
```

```zsh
if which renlog > /dev/null 2>&1; then
    if [[ "$(ps -o comm= -p $PPID)" != "renlog" ]]; then
        renlog_dir=/tmp/renlog
        exec renlog --log-level info log --renlog-dir ${renlog_dir} --cmd 'zsh -l'
    else
        eval "$(renlog show-zsh-rc)"
    fi
fi
```

## 利用方法

設定を入れたうえで適当なコマンドを実行すると、実行結果の最後にログファイルへのパスが表示されます。

```
$ ls
cgroup@  mnt@  pid@               time@               user@
ipc@     net@  pid_for_children@  time_for_children@  uts@
[/tmp/renlog-akira/14620/20260328_110823_496_ls--F---color_auto.log]
```

ログファイルには

- 実行したコマンド
- 実行時刻
- 終了コード
- 標準出力と標準エラー出力

が保存されています。

```
$ cat /tmp/renlog-akira/14620/20260328_110823_496_ls--F---color_auto.log
# renlog Command Log
# Command: ls -F --color=auto
# Started: 2026-03-28 11:08:23 UTC
# Exit Status: 0

cgroup@  mnt@  pid@               time@               user@
ipc@     net@  pid_for_children@  time_for_children@  uts@
[/tmp/renlog-akira/14620/20260328_110935_647_cat-_tmp_renlog-akira_14620_20260328_110823_496_ls--F---color_auto.log.log]
```

さらに、次の設定を `.zshrc` に追加しておくと、Alt + 1 で直前のログを `neovim` で開けます。

```
renlog_view_last_cmd() {
    local last_log_file=$(cat ${RENLOG_LAST_LOG_FILE})
    if [ -f "${last_log_file}" ]; then
        nvim "${last_log_file}"
    else
        echo "No log file found."
    fi
}

zle -N renlog_view_last_cmd
bindkey -s '^[1' 'renlog_view_last_cmd\n'
```
