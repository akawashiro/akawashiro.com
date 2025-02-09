# straceprof

## 三行まとめ
- _straceprof_ は `strace` コマンドを利用してLinxu 上のマルチプロセスで動くプログラムをプロファイルするためのソフトウェアです。
- _straceprof_ は `strace` コマンドが使えるところならどこでも使うことができます。
- _straceprof_ は特にソフトウェアのビルドのプロファイルを念頭に置いて書かれています。

## とりあえず使ってみたい人向け

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
ビルドしているのは、例えば、Linux カーネルや Julia、PyTorch、GNU libc といったソフトウェアです。
これらのソフトウェアはフルビルドに5分から30分程度かかります。
差分ビルドであってもフルビルドほどではないにせよ、コーヒーを淹れに行く程度の時間がかかります。

この時間は少し変更を入れて動作確認するたびにかかるので、作業効率を上げるためにはこのビルド時間を縮めることが大変重要です。
ビルド時間を短縮するというのは一種のパフォーマンスチューニングなので、有名な「推測するな、計測せよ」従えばまず計測することが重要です。
当然、ビルドプロセス全体のプロファイルがとりたくなります。

ここでビルドプロセスのプロファイルをとるのがむつかしい場合が多い、という問題があります。
ソフトウェアのビルドに使われているツールは多様で、しかも多くの場合それらがシェルスクリプトや Dockerfile などで組み合わされています。
個々の `CMake` や `cargo` といったツールにはプロファイラがあるかもしれませんが、結局知りたいのはビルドプロセス全体の所要時間なので全体をまとめてプロファイルできる必要があります。

さらに、ソフトウェアがビルドされる環境は必ずしもプロファイルしやすい場所ではありません。
よくあるのは CI でビルドしている場合でしょう。
Github Action などで `perf` や `perfetto` などのちゃんとしたプロファイラを設定するのはそれ自体が骨の折れる作業ですし、必要な権限がなくそもそも動かすのが不可能である可能性もあります。
また、ビルド環境を完全に固定するために Docker などのコンテナ環境を利用している場合は、プロファイラのセットアップがさらに面倒になります。

## straceprof

_straceprof_ はとにかくお手軽にビルドプロセス全体のプロファイルをとるためのツールです。
プロファイルをとるのに必要なのは `strace` コマンドだけです。
ほとんどすべての Linux ディストリビューションで簡単にインストールすることができます。

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

[^execve-exit_group]: そうでない場合もありますが、ビルド中に起動されるほとんどのプロセスについてはこう思って問題ありません。

`straceprof` は `strace` の出力をパースすることで各プロセスの所要時間を割り出し、[matplotlib](https://matplotlib.org/) を使って画像を出力します。
画像の縦方向には意味がなく、可能な限り画像サイズが小さくなる順番にプロセスが並んでいます。

## 使用例

### Julia のビルド

[Julia](https://github.com/JuliaLang/julia) というプログラミング言語をビルドしたプロファイラ結果がこちらです。
ビルドを開始してから140秒から320秒の間、`compiler.jl`と`sys.jl`の処理を行っており、これが全体のボトルネックであり、この処理を高速化できれば、ビルド時間を短縮することができます。

<img src="./julia_build.png">

### Linux カーネルのビルド

僕がよく使っている Linux カーネルをビルドする[スクリプト](https://github.com/akawashiro/public-tools/blob/master/build-install-linux.sh) のプロファイル結果がこちらです。
C言語のコンパイルが大量に行われています。

<img src="./linux_build.png">