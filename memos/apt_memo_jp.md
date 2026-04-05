---
title: よく使う APT 関連のコマンド
layout: default
---

# よく使う APT 関連のコマンド

`apt update` とか `apt install` の他に知っておくと便利なものたち。

## ファイル名からパッケージを知りたい

```
$ dpkg -S /usr/lib/libperf-jvmti.so 
linux-perf: /usr/lib/libperf-jvmti.so
```

## どのパッケージをいれると 特定のファイルがインストールされるのか知りたい

```
$ apt-file search bin/rg
...
ripgrep: /usr/bin/rg
...
```

## パッケージ名や説明から探したい

パッケージ名がうろ覚えのときに使う。

```
$ apt search ripgrep
$ apt search perf
```

## パッケージの詳細を見たい

説明、依存関係、サイズ、提供元などを確認する。

```
$ apt show ripgrep
```

## インストール済みのパッケージにどんなファイルが入っているか見たい

そのパッケージが配置したファイル一覧を見る。

```
$ dpkg -L ripgrep         
/.
/usr
/usr/bin
/usr/bin/rg
...
```

## 依存関係を見たい

そのパッケージが何に依存しているかを見る。

```
$ apt depends ripgrep
```

逆に、そのパッケージを必要としているものを見たいときはこうする。

```
$ apt rdepends libssl3
```

## パッケージがインストール済みか確認したい

```
$ dpkg -s ripgrep
```

## パッケージを削除したい

設定ファイルは残して削除する。

```
$ sudo apt remove ripgrep
```

設定ファイルも含めて完全に削除する。

```
$ sudo apt purge ripgrep
```
