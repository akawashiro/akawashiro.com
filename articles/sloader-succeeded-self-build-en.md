---
title: sloader: alternative Linux loader
layout: default
---

# Alternative Linux loader <!-- omit in toc -->

In order to fully understand the behavior of the standard Linux loader, `ld-linux-x86-64.so.2`, I am developping a complete replacement for `ld-linux-x86-64.so.2` [https://github.com/akawashiro/sloader](https://github.com/akawashiro/sloader) for about two years and now it can launch all softwares t obuild sloader itself and some GUI applications.

## Table of contents <!-- omit in toc -->

- [What is a loader](#what-is-a-loader)
- [Problems of `ld-linux-x86-64.so.2`](#problems-of-ld-linux-x86-64so2)
- [sloader: an alternative Linux loader](#sloader-an-alternative-linux-loader)
- [Current status of sloader](#current-status-of-sloader)
- [Implementation of sloader](#implementation-of-sloader)
  - [Resolution of symbols in libc.so](#resolution-of-symbols-in-libcso)
  - [Secure TLS space for a loaderd program](#secure-tls-space-for-a-loaderd-program)
- [Current problems of sloader](#current-problems-of-sloader)
- [Support me](#support-me)

## What is a loader

When you execute an executable binary file in Linux using [execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html), There are two execution paths.

- The Linux kernel directly loads the binary file into memory space.
- The loader[^1] specified by the binary file loads it into memory space.

You can look at the `PT_INTERP` segment of the binary file with `readelf -l` to see in which way the binary file is loaded . In most cases, it will say `Requesting program interpreter: /lib64/ld-linux-x86-64.so.2`, which means `/lib64/ld-linux-x86-64.so.2` will load the binary file into memory space.

```
> readelf -l $(which nvim) | grep INTERP -A 2
  INTERP         0x0000000000000318 0x0000000000000318 0x0000000000000318
                 0x000000000000001c 0x000000000000001c  R      0x1
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]
```

`ld-linux-x86-64.so.2` performs three processes when loading a binary file

- Searches for shared libraries required by the binary
- Loads shared libraries and binaries into memory space
- Resolves symbols in shared libraries and binaries

It is important to understand the exact behavior of `ld-linux-x86-64.so.2`. For example, useful hacks with environment variables such as LD_PRELOAD and LD_AUDIT are achieved by changing their behavior. If you understand the behavior of `ld-linux-x86-64.so.2`, you will be able to guess what is and is not possible with these environment variables. Also, that understanding is essential for producing hacky software like [https://github.com/akawashiro/sold](https://github.com/akawashiro/sold), which links dynamically linked libraries statically.

## Problems of `ld-linux-x86-64.so.2`

`ld-linux-x86-64.so.2` is installed on Linux as part of glibc, and all of its source code is [publicly available](https://www.gnu.org/software/libc/sources.html). However, there are two problems in understanding the behavior of `ld-linux-x86-64.so.2` from the publicly available source code.

The first problem is that glibc source code is difficult to read. glibc is also required to be portable to multiple architectures such as x86-64, ARM, SPARC, etc. For this reason, macros are used extensively throughout the source code, making it difficult to follow the program flow.

The second problem is `ld-linux-x86-64.so.2` initialize `libc.so` simultaneously when it loads a program. Because of this, We cannot understand the loading process separating from the initialization of `libc.so`. `ld-linux-x86-64.so.2` and `libc.so` are included in the same source code tree, and their boundary is very ambiguous.

## sloader: an alternative Linux loader

I have decided to develop a new loader that can replace `ld-linux-x86-64.so.2` to solve the problem described above and understand the behavior of `ld-linux-x86-64.so.2`. In other words, I am trying to load all programs (`systemd`, `cat`, `find`, `firefox`, etc.) that run on Linux by my new loader.

The name of this loader is `sloader` and the repository is located at [https://github.com/akawashiro/sloader/](https://github.com/akawashiro/sloader/). The development of `sloader` is based on the following two principles.

The first principle is to use modern C++ instead of C. I am trying to increase readability by using modern C++ features up to C++20. I decided that a language compatible with the C language would be better, although I wanted to use Rust to develop my new loader.

The second principle is not to initialize `libc.so`. The goal is to understand only the load part, so I will not do the complex and mysterious initialization of `libc.so`. In fact, I couldn't do it. I will explain later how to load a program that depends on `libc.so` while skipping the initialization of `libc.so`.

## Current status of sloader

`sloader` is not yet ready to fully replace `ld-linux-x86-64.so.2`. However, it works in some extent, and it is possible to run all the software needed to build `sloader`. It means that `sloader` can load `cmake`, `g++`, `ld`, and `ninja` to generate `sloader` itself binary file.

[https://github.com/akawashiro/sloader/blob/master/make-sloader-itself.sh](https://github.com/akawashiro/sloader/blob/master/make-sloader-itself.sh) actually generates the `sloader` binary using `sloader`. I show the main part below.

```
$ sloader cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON -S . -B build \
    -D CMAKE_C_COMPILER_LAUNCHER=sloader  -D CMAKE_CXX_COMPILER_LAUNCHER=sloader \
    -D CMAKE_C_LINKER_LAUNCHER=sloader -D CMAKE_CXX_LINKER_LAUNCHER=sloader
$ sloader make VERBOSE=1
```

`sloader` also successfully launches several GUI applications. This image is a screenshou of launching `xeyes`, `xconsole`, and `xcalc` using `sloader`. `xeyes` originally displays circular eyes instead of hexagons, but due to some bug in `sloader`, eyes are hexagons.
![launch GUI application using `sloader`](./xapps-launched-by-sloader.png)

## Implementation of sloader

### Resolution of symbols in libc.so

As mentioned earlier, `sloader` aims to replace `ld-linux-x86-64.so.2`. Naturally, the programs I want to load with `sloader` depend on `libc.so`. On the other hand, it does not load `libc.so`.

`sloader` resolves this problem by using `libc.so` linked to `sloader` itself. When `sloader` finds a relocation information pointing to symbols in `libc.so`, `sloader` resolves it in an unusual way. Specifically, in [dyn_loader.cc#L621](https://github.com/akawashiro/sloader/blob/502bae54b403423f79e04caa4901c4a76cb6aaca/dyn_loader.cc#L621), when the symbol name in `R_X86_64_GLOB_DAT` or `R_X86_64_JUMP_SLOT` is from libc, `sloader` resolves the relocation to [std::map<std::string, Elf64_Addr> function in sloader_libc_map](https://github.com/akawashiro/sloader/blob/502bae54b403423f79e04caa4901c4a76cb6aaca/libc_mapping.cc#L248).

### Secure TLS space for a loaderd program

As described in [above](#resolution-of-symbols-in-libcso), programs loaded with `sloader` use the `libc.so` linked to `sloader` itself, but there is another problem with this approach: when the loaded program accesses the Thread Local Storage (TLS) variable, it accesses the `sloader`'s own TLS area.

This problem is worked around by reserving a dummy TLS area in the `sloader`'s own TLS area. [tls_secure.cc#L4](https://github.com/akawashiro/sloader/blob/502bae54b403423f79e04caa4901c4a76cb6aaca/tls_secure.cc#L4) of 4096 bytes. dummy TLS area is defined at the beginning of the TLS area, and the loaded program refers to this area.

```
constexpr int TLS_SPACE_FOR_LOADEE = 4096;
thread_local unsigned char sloader_dummy_to_secure_tls_space[TLS_SPACE_FOR_LOADEE] = {0, 0, 0, 0};
```

This seems to be the end of the matter, but there is still a problem. The problem is that we cannot define a dummy TLS area at the beginning of a TLS area in the usual way. Currently, I secure the space by linking `tls_secure.o` at the last argument to the linker in [CMakeLists.txt#L32](https://github.com/akawashiro/sloader/blob/502bae54b403423f79e04caa4901c4a76cb6aaca/CMakeLists.txt#L32), but this method depends on the linker implementation. To make matters worse, this last-linking method does not work when `libc.a` is statically linked. This makes it very embarrassing that `sloader` now requires `ld-linux-x86-64.so.2` to start.

## Current problems of sloader

First, as mentioned [above](#secure-tls-space-for-a-loaderd-program), it is not possible to start `sloader` without `ld-linux-x86-64.so.2`. This problem should be solved by replacing the last-linking hack that allocates the TLS dummy area with another one, or by improving this hack using the linker script.

Next, `sloader` cannot load a lot of software such as `neovim` and `firefox`, which they cause Segmentation Faults. The reason of this is still unknown.

Finally, the `sloader` relocation process is slow. It takes more than a second to launch larger programs such as `firefox`. However, this is simply a performance issue and should be resolved by taking profiles and improving using their results.

## Support me

Please star [https://github.com/akawashiro/sloader](https://github.com/akawashiro/sloader).

[^1]: A loader is sometimes called a "dynamic linker", but this article is unified by "loader".
