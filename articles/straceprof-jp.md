# straceprof

## 三行まとめ
- _straceprof_ は `strace` コマンドを利用してマルチプロセスで動くプログラムをプロファイルするためのソフトウェアです。
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

## 使用例

### Linux カーネルのビルド
<img src="./linux_build.png">

### Julia のビルド
<img src="./julia_build.png">

### PyTorch のビルド

<img src="./pytorch_build.png">