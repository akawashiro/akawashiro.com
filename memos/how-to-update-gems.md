---
title: How to update gems
layout: default
---

```
bundle config set --local path vendor/bundle
bundle install
bundle update
rm -rf vendor
```
