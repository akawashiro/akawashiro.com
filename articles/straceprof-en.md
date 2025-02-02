---
title: straceprof — A Software for Easily Profiling Build Processes
layout: default
---

# straceprof — A Software for Easily Profiling Build Processes

## Summary in Three Lines
- [_straceprof_](https://github.com/akawashiro/straceprof) is a software that uses the `strace` command to profile programs running as multi-processes on Linux.
- [_straceprof_](https://github.com/akawashiro/straceprof) can be used anywhere the `strace` command is available.
- [_straceprof_](https://github.com/akawashiro/straceprof) is specifically written with profiling software builds in mind.

## For Those Who Want to Try It Quickly

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

<!-- Motivation -->
## Profiling Software Builds

In both work and personal projects, I frequently find myself building larger software. For example, I often build [the Linux kernel](https://github.com/torvalds/linux), [Julia](https://github.com/JuliaLang/julia), [PyTorch](https://github.com/pytorch/pytorch), and [glibc](https://sourceware.org/glibc/).
Building these projects takes about 5 to 30 minutes for a full build on my PC[^mypc].
Even with incremental builds, they still take a considerable amount of time, though not as much as a full build.

[^mypc]: CPU: AMD Ryzen 9 5950X, Memory: 64 GiByte

This build time adds up every time I make changes and need to verify the result, so reducing it is critical for improving work efficiency.
Reducing build time is a form of performance tuning.
Therefore, profiling the entire build process and identifying bottlenecks is necessary.

However, profiling the build process can be difficult. The tools used in the software build are diverse and may be combined in shell scripts or Dockerfiles.
While individual tools like `CMake` or `cargo` may have their own profilers, what I really want to know is the total time taken for the entire build process, so I need a way to profile the whole process.

Furthermore, the environment in which software is built is not always conducive to profiling.
A common case is when builds are done in CI environments.
Setting up rich profilers like `perf` or `perfetto` on a platform like Github Actions is challenging and may be impossible without the necessary permissions.
Additionally, when using containerized environments like Docker to fully isolate the build environment, setting up a profiler becomes even more cumbersome.

## straceprof

_straceprof_ is a tool designed to easily profile the entire build process.
All you need to profile is the `strace` command.
This command can be easily installed on almost all Linux distributions.

First, use the `strace` command to build and profile the process:
```
$ strace \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    --absolute-timestamps=format:unix,precision:us \
    --output=straceprof.log \
    <command to profile>
```

Next, pass the output to the `straceprof` command to visualize the profile result. It's that simple!

```
$ straceprof \
    --log=straceprof.log \
    --output=straceprof.png
```

<img src="./linux_build.png">

## How It Works

There is a command called [strace](https://strace.io/).
By using this command, you can monitor all system calls made by a process and log them to a file.

In Linux, many processes start with the [execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html) system call and end with [exit_group(2)](https://man7.org/linux/man-pages/man2/exit_group.2.html)[^execve-exit_group].
Therefore, by recording the time of the `execve(2)` and `exit_group(2)` system calls for each process using `strace`, we can calculate the duration of that process.

[^execve-exit_group]: While not all processes behave this way, most processes launched during a build (such as compilers and linkers) follow this pattern.

_straceprof_ parses the output from `strace` to determine the duration of each process and uses [matplotlib](https://matplotlib.org/) to generate a visual representation. The vertical axis of the image is meaningless, and the processes are arranged in order to minimize the image size.

## Example Usage

### Building Julia

The profiler result of a full build of the [Julia](https://github.com/JuliaLang/julia) programming language can be found [here](https://akawashiro.com/articles/julia_build.png).
Between 140 and 320 seconds after the build starts, the processes `compiler.jl` and `sys.jl` are running, and this is the main bottleneck in the build.
By optimizing these processes, we can reduce the build time.

<img src="./julia_build.png">

### Building the Linux Kernel

The profiler result of the script I often use to build the Linux kernel can be found [here](https://akawashiro.com/articles/linux_build.png).
C language compilation is done in parallel, and there is no clear bottleneck.

<img src="./linux_build.png">

### Building a Container Image

Building container images can often take a long time.
With `straceprof`, you can profile this build process as well.
Note that when profiling a container image build, use `podman` instead of `docker`.
The `podman` command does not rely on a daemon when building images, allowing `strace` to capture all the processes launched during the build.

```
$ cat Dockerfile
FROM ubuntu:24.04
RUN apt-get update
RUN apt-get install -y python3 python3-pip
$ strace \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    --absolute-timestamps=format:unix,precision:us \
    --output=straceprof.log \
    podman build . --no-cache
$ straceprof \
    --log=straceprof.log \
    --output=straceprof.png
```

<img src="./podman-build-profile.png">

## A Request

Please give a star to [https://github.com/akawashiro/straceprof](https://github.com/akawashiro/straceprof).
