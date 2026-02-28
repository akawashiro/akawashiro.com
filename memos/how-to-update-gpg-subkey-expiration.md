---
title: How to update gpg subkey expiration
layout: default
---

# USB に入っている主鍵をインポートする

```
$ gpg --import 3FB4269CA58D57F0326C1F7488737135568C1AC5-seckey-20240224.asc
```

# 期限の切れた subkey を更新する

`key 1`、`key 2`、`key 3` で `[S]`、`[E]`、`[A]` をそれぞれ選択して1年期限を延ばす。
鍵の番号は固定されていないので`[S]`、`[E]`、`[A]`を目で確認すること。
```
$ gpg --edit-key 3FB4269CA58D57F0326C1F7488737135568C1AC5
key 1
key 2
key 3
expire
1y
save
```

# USB の鍵をアップデートする

```
$ gpg --export --armor 3FB4269CA58D57F0326C1F7488737135568C1AC5 > 3FB4269CA58D57F0326C1F7488737135568C1AC5-pubkey-20260228.asc
$ gpg --export-secret-keys --armor 3FB4269CA58D57F0326C1F7488737135568C1AC5 > 3FB4269CA58D57F0326C1F7488737135568C1AC5-seckey-20260228.asc
$ gpg --gen-revoke 3FB4269CA58D57F0326C1F7488737135568C1AC5 > 3FB4269CA58D57F0326C1F7488737135568C1AC5-revcert-20260228.asc
$ gpg --export-secret-subkeys --armor 3FB4269CA58D57F0326C1F7488737135568C1AC5 > 3FB4269CA58D57F0326C1F7488737135568C1AC5-seckey-sub-20260228.asc
```
このあと USB にコピーする。

# 主鍵を削除する

```
$ gpg --delete-secret-key 3FB4269CA58D57F0326C1F7488737135568C1AC5
$ gpg --import 3FB4269CA58D57F0326C1F7488737135568C1AC5-seckey-sub-20260228.asc
```

# 公開鍵を更新する

このサイトに載せている公開鍵を更新する。この処理のあと、サイトをデプロイしなおす。
```
$ gpg --export --armor 3FB4269CA58D57F0326C1F7488737135568C1AC5 > 3FB4269CA58D57F0326C1F7488737135568C1AC5.txt
```

# ほかのマシンで subkey を更新する

```
$ curl https://akawashiro.com/3FB4269CA58D57F0326C1F7488737135568C1AC5.txt > pubkey
$ gpg --import pubkey
```
