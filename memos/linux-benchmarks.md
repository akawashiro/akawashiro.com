---
title: Linux Benchmarks
layout: default
---

# Linux Benchmarks

## lmbench

### How to build
```
$ git clone https://github.com/intel/lmbench.git
$ cd lmbench
$ git show HEAD | head -n1
commit 941a0dcc0e7bdd9bb0dee05d7f620e77da8c43af
$ git diff --patch
diff --git a/scripts/build b/scripts/build
index d233b37..f41d549 100755
--- a/scripts/build
+++ b/scripts/build
@@ -18,7 +18,7 @@ done

 trap 'rm -f ${BASE}$$.s ${BASE}$$.c ${BASE}$$.o ${BASE}$$; exit 1' 1 2 15

-LDLIBS=-lm
+LDLIBS="-lm -ltirpc"

 # check for HP-UX's ANSI compiler
 echo "main(int ac, char *av[]) { int i; }" > ${BASE}$$.c
$ sudo apt install libtirpc-dev
$ make build CPPFLAGS="-I /usr/include/tirpc" LDFLAGS="-ltirpc" -j
```
