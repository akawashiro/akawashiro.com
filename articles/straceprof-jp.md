---
title: straceprof——とにかく簡単にビルドのプロファイルを取るためのソフトウェア
layout: default
---

# straceprof——とにかく簡単にビルドのプロファイルを取るためのソフトウェア

## 三行まとめ
- [_straceprof_](https://github.com/akawashiro/straceprof) は `strace` コマンドを利用して Linux 上のマルチプロセスで動くプログラムをプロファイルするためのソフトウェアです。
- [_straceprof_](https://github.com/akawashiro/straceprof) は `strace` コマンドが使えるところならどこでも使うことができます。
- [_straceprof_](https://github.com/akawashiro/straceprof) はソフトウェアのビルドのプロファイルを特に念頭に置いて書かれています。

## とりあえず使ってみたい人向けのコマンド

```bash
$ sudo apt-get install strace
$ pip install straceprof
$ strace \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    --absolute-timestamps=format:unix,precision:us \
    --output=straceprof.log \
    <command to profile>
$ straceprof \
    --log=straceprof.log \
    --output=straceprof.png
```

<img src="./linux_build.png">

<!-- 動機 -->
## ソフトウェアのビルドのプロファイル

仕事でもプライベートでも少し規模の大きいソフトウェアをビルドする機会がかなりの頻度であります。
例えば、ビルドしているのは、[Linux カーネル](https://github.com/torvalds/linux)や [Julia](https://github.com/JuliaLang/julia)、[PyTorch](https://github.com/pytorch/pytorch)、[glibc](https://sourceware.org/glibc/) といったソフトウェアです。
これらのソフトウェアは僕のPC[^mypc]でフルビルドに5分から30分程度かかります。
差分ビルドであってもフルビルドほどではないにせよそれなりの時間がかかります。

[^mypc]: CPU: AMD Ryzen 9 5950X、メモリ: 64 GiByte

このビルド時間は少し変更を入れて動作確認するたびにかかるので、作業効率を上げるためにはこれを縮めることが大変重要です。
ビルド時間を短縮するというのは一種のパフォーマンスチューニングです。
このため、ビルドプロセス全体のプロファイルがとり、ボトルネックを特定する必要があります。

ここで、ビルドプロセスのプロファイルをとるのが難しい場合が多い、という問題があります。
ソフトウェアのビルドに使われているツールは多様で、しかもそれらがシェルスクリプトや Dockerfile などで組み合わされていることがあります。
個々の `CMake` や `cargo` といったツールにはプロファイラがあるかもしれませんが、結局知りたいのはビルドプロセス全体の所要時間なので全体をまとめてプロファイルできる必要があります。

さらに、ソフトウェアがビルドされる環境は必ずしもプロファイルしやすい場所ではありません。
よくあるのは CI でビルドしている場合でしょう。
Github Action 上などで `perf` や `perfetto` などのリッチなプロファイラを設定するのはそれ自体が骨の折れる作業ですし、必要な権限がなくそもそも動かすのが不可能である可能性もあります。
また、ビルド環境を完全に固定するために Docker などのコンテナ環境を利用している場合は、プロファイラのセットアップがさらに面倒になります。

## straceprof

_straceprof_ はとにかくお手軽にビルドプロセス全体のプロファイルをとるためのツールです。
プロファイルをとるのに必要なのは `strace` コマンドだけです。
このコマンドはほとんどすべての Linux ディストリビューションで簡単にインストールすることができます。

まず、`strace` コマンドをつけてビルドしてプロファイルを取ります。
```
$ strace \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    --absolute-timestamps=format:unix,precision:us \
    --output=straceprof.log \
    <command to profile>
```

次に、この出力を `straceprof` コマンドに渡すとプロファイル結果が可視化されます。簡単ですね!

```
$ straceprof \
    --log=straceprof.log \
    --output=straceprof.png
```

<img src="./linux_build.png">

## 仕組み

[strace](https://strace.io/) というコマンドがあります。
このコマンドを利用すると、プロセスが発行する全てのシステムコールを監視し、ファイルに記録することができます。

また、Linux では多くのプロセスが [execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html)システムコールで開始され、[exit_group(2)](https://man7.org/linux/man-pages/man2/exit_group.2.html)で終了します[^execve-exit_group]。
このため、`strace`で各プロセスの`execve(2)`と`exit_group(2)`の時間を記録すれば、そのプロセスの所要時間を割り出すことができます。

[^execve-exit_group]: そうでない場合もありますが、ビルド中に起動されるほとんどのプロセスはコンパイラやリンカであり、このように考えて問題ないと考えています。

`straceprof` は `strace` の出力をパースすることで各プロセスの所要時間を割り出し、[matplotlib](https://matplotlib.org/) を使って画像を出力します。
画像の縦方向には意味がなく、可能な限り画像サイズが小さくなる順番にプロセスが並んでいます。

## 使用例

### Julia のビルド

[Julia](https://github.com/JuliaLang/julia) というプログラミング言語をフルビルドしたプロファイラ結果が[こちら](https://akawashiro.com/articles/julia_build.png)です。
ビルドを開始してから140秒から320秒の間、`compiler.jl`と`sys.jl`の処理を行っており、これが全体のボトルネックです。
この処理を高速化できれば、ビルド時間を短縮することができます。

<img src="./julia_build.png">

### Linux カーネルのビルド

僕がよく使っている Linux カーネルをビルドする[スクリプト](https://github.com/akawashiro/public-tools/blob/master/build-install-linux.sh) のプロファイル結果が[こちら](https://akawashiro.com/articles/linux_build.png)です。
C言語のコンパイルが並列に行われており、明確なボトルネックはありません。

<img src="./linux_build.png">

## お願い

[https://github.com/akawashiro/straceprof](https://github.com/akawashiro/straceprof) にスターをつけてください。