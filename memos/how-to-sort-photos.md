---
title: 写真の整理
layout: default
---

# 写真をアップロードする

スマホから NAS の `akira-backup/UploadedPictures` にアップロードする。

# 写真を整理する

```
~/private-tools/mount-NAS-with-rclone.sh
~/public-tools/photo_sort.sh --dry-run /media/akira/QNAPTS230/UploadedPictures /media/akira/QNAPTS230/Pictures
```

を実行する。`--dry-run` を外すと実際にコピーを実行する。
ファイル名は `2021-08-09T14-12-48+0900-5d1383c0.jpg` のようになっている。
末尾に SHA 256 ハッシュをつけてファイル名の衝突を回避している。
