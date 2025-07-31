---
title: Linux Benchmarks
layout: default
---

# Linux Benchmarks

## lmbench

### How to build
```
$ uname -a
Linux masumi 6.14.0-27-generic #27~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 22 17:38:49 UTC 2 x86_64 x86_64 x86_64 GNU/Linux
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

#### TCP bandwidth
```
$ ./bin/x86_64-linux-gnu/bw_tcp -s
$ ./bin/x86_64-linux-gnu/bw_tcp -W 3 -N 10 -M 1024m localhost
1073.741824 5434.25 MB/sec
```

#### Pipe Bandwidth
```
$ ./bin/x86_64-linux-gnu/bw_pipe -W 3 -N 10 -M 1024m
Pipe bandwidth: 3704.20 MB/sec
```

#### Syscall Latency
```
$ ./bin/x86_64-linux-gnu/lat_syscall -W 3 -N 10 null
Simple syscall: 0.1328 microseconds
$ ./bin/x86_64-linux-gnu/lat_syscall -W 3 -N 10 read
Simple read: 0.2191 microseconds
$ ./bin/x86_64-linux-gnu/lat_syscall -W 3 -N 10 write
Simple write: 0.2009 microseconds
$ ./bin/x86_64-linux-gnu/lat_syscall -W 3 -N 10 stat
Simple stat: 1.0037 microseconds
$ ./bin/x86_64-linux-gnu/lat_syscall -W 3 -N 10 fstat
Simple fstat: 0.3176 microseconds
$ ./bin/x86_64-linux-gnu/lat_syscall -W 3 -N 10 open
Simple open/close: 2.1441 microseconds
```

#### Context Switch Latency
The unit is in microseconds.
```
$ ./bin/x86_64-linux-gnu/lat_ctx -W 3 -N 10 -s 1 2 4 8 16

"size=1k ovr=0.67
2 3.37
4 3.80
8 3.89
16 4.25
```

<summary> Output of `make results` </summary>
<details>
```
$ make results
cd src && make results
make[1]: Entering directory '/home/akira/ghq/github.com/intel/lmbench/src'
gmake[2]: Entering directory '/home/akira/ghq/github.com/intel/lmbench/src'
gmake[2]: Nothing to be done for 'all'.
gmake[2]: Leaving directory '/home/akira/ghq/github.com/intel/lmbench/src'
gmake[2]: Entering directory '/home/akira/ghq/github.com/intel/lmbench/src'
gmake[2]: Nothing to be done for 'opt'.
gmake[2]: Leaving directory '/home/akira/ghq/github.com/intel/lmbench/src'
=====================================================================

		L M B E N C H   C ON F I G U R A T I O N
		----------------------------------------

You need to configure some parameters to lmbench.  Once you have configured
these parameters, you may do multiple runs by saying

	"make rerun"

in the src subdirectory.

NOTICE: please do not have any other activity on the system if you can
help it.  Things like the second hand on your xclock or X perfmeters
are not so good when benchmarking.  In fact, X is not so good when
benchmarking.

=====================================================================

Hang on, we are calculating your timing granularity.
OK, it looks like you can time stuff down to 5000 usec resolution.

Hang on, we are calculating your timing overhead.
OK, it looks like your gettimeofday() costs 0 usecs.

Hang on, we are calculating your loop overhead.
OK, it looks like your benchmark loop costs 0.00000000 usecs.

=====================================================================

If you are running on an MP machine and you want to try running
multiple copies of lmbench in parallel, you can specify how many here.

Using this option will make the benchmark run 100x slower (sorry).

NOTE:  WARNING! This feature is experimental and many results are 
	known to be incorrect or random!

MULTIPLE COPIES [default 1] 1
Options to control job placement
1) Allow scheduler to place jobs
2) Assign each benchmark process with any attendent child processes
   to its own processor
3) Assign each benchmark process with any attendent child processes
   to its own processor, except that it will be as far as possible
   from other processes
4) Assign each benchmark and attendent processes to their own
   processors
5) Assign each benchmark and attendent processes to their own
   processors, except that they will be as far as possible from
   each other and other processes
6) Custom placement: you assign each benchmark process with attendent
   child processes to processors
7) Custom placement: you assign each benchmark and attendent
   processes to processors

Note: some benchmarks, such as bw_pipe, create attendent child
processes for each benchmark process.  For example, bw_pipe
needs a second process to send data down the pipe to be read
by the benchmark process.  If you have three copies of the
benchmark process running, then you actually have six processes;
three attendent child processes sending data down the pipes and 
three benchmark processes reading data and doing the measurements.

Job placement selection: 1
=====================================================================

Several benchmarks operate on a range of memory.  This memory should be
sized such that it is at least 4 times as big as the external cache[s]
on your system.   It should be no more than 80% of your physical memory.

The bigger the range, the more accurate the results, but larger sizes
take somewhat longer to run the benchmark.

MB [default 44954] 4096
Checking to see if you have 4096 MB; please wait for a moment...
2MB OK
3MB OK
4MB OK
5MB OK
6MB OK
7MB OK
8MB OK
10MB OK
12MB OK
14MB OK
16MB OK
20MB OK
24MB OK
28MB OK
32MB OK
40MB OK
48MB OK
56MB OK
64MB OK
80MB OK
96MB OK
112MB OK
128MB OK
160MB OK
192MB OK
224MB OK
256MB OK
320MB OK
384MB OK
448MB OK
512MB OK
640MB OK
768MB OK
896MB OK
1024MB OK
1280MB OK
1536MB OK
1792MB OK
2048MB OK
2560MB OK
3072MB OK
3584MB OK
4096MB OK

2MB OK
3MB OK
4MB OK
5MB OK
6MB OK
7MB OK
8MB OK
10MB OK
12MB OK
14MB OK
16MB OK
20MB OK
24MB OK
28MB OK
32MB OK
40MB OK
48MB OK
56MB OK
64MB OK
80MB OK
96MB OK
112MB OK
128MB OK
160MB OK
192MB OK
224MB OK
256MB OK
320MB OK
384MB OK
448MB OK
512MB OK
640MB OK
768MB OK
896MB OK
1024MB OK
1280MB OK
1536MB OK
1792MB OK
2048MB OK
2560MB OK
3072MB OK
3584MB OK
4096MB OK

2MB OK
3MB OK
4MB OK
5MB OK
6MB OK
7MB OK
8MB OK
10MB OK
12MB OK
14MB OK
16MB OK
20MB OK
24MB OK
28MB OK
32MB OK
40MB OK
48MB OK
56MB OK
64MB OK
80MB OK
96MB OK
112MB OK
128MB OK
160MB OK
192MB OK
224MB OK
256MB OK
320MB OK
384MB OK
448MB OK
512MB OK
640MB OK
768MB OK
896MB OK
1024MB OK
1280MB OK
1536MB OK
1792MB OK
2048MB OK
2560MB OK
3072MB OK
3584MB OK
4096MB OK

Hang on, we are calculating your cache line size.
OK, it looks like your cache line is 64 bytes.

=====================================================================

lmbench measures a wide variety of system performance, and the full suite
of benchmarks can take a long time on some platforms.  Consequently, we
offer the capability to run only predefined subsets of benchmarks, one
for operating system specific benchmarks and one for hardware specific
benchmarks.  We also offer the option of running only selected benchmarks
which is useful during operating system development.

Please remember that if you intend to publish the results you either need
to do a full run or one of the predefined OS or hardware subsets.

SUBSET (ALL|HARWARE|OS|DEVELOPMENT) [default all] OS
=====================================================================

This benchmark measures, by default, file system latency.  That can
take a long time on systems with old style file systems (i.e., UFS,
FFS, etc.).  Linux' ext2fs and Sun's tmpfs are fast enough that this
test is not painful.

If you are planning on sending in these results, please don't do a fast
run.

If you want to skip the file system latency tests, answer "yes" below.

SLOWFS [default no] no
=====================================================================

If you are running on an idle network and there are other, identically
configured systems, on the same wire (no gateway between you and them),
and you have rsh access to them, then you should run the network part
of the benchmarks to them.  Please specify any such systems as a space
separated list such as: ether-host fddi-host hippi-host.

REMOTE [default none] no^H ^H^H ^H
=====================================================================

Calculating mhz, please wait for a moment...
I think your CPU mhz is 

	4952 MHz, 0.2019 nanosec clock
	
but I am frequently wrong.  If that is the wrong Mhz, type in your
best guess as to your processor speed.  It doesn't have to be exact,
but if you know it is around 800, say 800.  

Please note that some processors, such as the P4, have a core which
is double-clocked, so on those processors the reported clock speed
will be roughly double the advertised clock rate.  For example, a
1.8GHz P4 may be reported as a 3592MHz processor.

Processor mhz [default 4952 MHz, 0.2019 nanosec clock] 
=====================================================================

We need a place to store a 4096 Mbyte file as well as create and delete a
large number of small files.  We default to /usr/tmp.  If /usr/tmp is a
memory resident file system (i.e., tmpfs), pick a different place.
Please specify a directory that has enough space and is a local file
system.

FSDIR [default /var/tmp] 
=====================================================================

lmbench outputs status information as it runs various benchmarks.
By default this output is sent to /dev/tty, but you may redirect
it to any file you wish (such as /dev/null...).

Status output file [default /dev/tty] 
=====================================================================

There is a database of benchmark results that is shipped with new
releases of lmbench.  Your results can be included in the database
if you wish.  The more results the better, especially if they include
remote networking.  If your results are interesting, i.e., for a new
fast box, they may be made available on the lmbench web page, which is

	http://www.bitmover.com/lmbench

Mail results [default yes] no
OK, no results mailed.
=====================================================================

Confguration done, thanks.

There is a mailing list for discussing lmbench hosted at BitMover. 
Send mail to majordomo@bitmover.com to join the list.
$ cat results/x86_64-linux-gnu/masumi.1
[lmbench3.0 results for Linux masumi 6.14.0-27-generic #27~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 22 17:38:49 UTC 2 x86_64 x86_64 x86_64 GNU/Linux]
[LMBENCH_VER: ]
[BENCHMARK_HARDWARE: NO]
[BENCHMARK_OS: YES]
[ALL: 512 1k 2k 4k 8k 16k 32k 64k 128k 256k 512k 1m 2m 4m 8m 16m 32m 64m 128m 256m 512m 1024m 2048m 4096m]
[DISKS: ]
[DISK_DESC: ]
[ENOUGH: 5000]
[FAST: ]
[FASTMEM: NO]
[FILE: /var/tmp/XXX]
[FSDIR: /var/tmp]
[HALF: 512 1k 2k 4k 8k 16k 32k 64k 128k 256k 512k 1m 2m 4m 8m 16m 32m 64m 128m 256m 512m 1024m 2048m]
[INFO: INFO.masumi]
[LINE_SIZE: 64]
[LOOP_O: 0.00000000]
[MB: 4096]
[MHZ: 4952 MHz, 0.2019 nanosec clock]
[MOTHERBOARD: ]
[NETWORKS: ]
[PROCESSORS: 32]
[REMOTE: ]
[SLOWFS: NO]
[OS: x86_64-linux-gnu]
[SYNC_MAX: 1]
[LMBENCH_SCHED: DEFAULT]
[TIMING_O: 0]
[LMBENCH VERSION: lmbench-3alpha4]
[USER: akira]
[HOSTNAME: masumi]
[NODENAME: masumi]
[SYSNAME: Linux]
[PROCESSOR: x86_64]
[MACHINE: x86_64]
[RELEASE: 6.14.0-27-generic]
[VERSION: #27~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 22 17:38:49 UTC 2]
[Wed Jul 30 06:09:48 AM JST 2025]
[ 06:09:48 up 9:08, 2 users, load average: 0.08, 0.20, 0.23]
./lmbench: 104: netstat: not found
[mount: sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)]
[mount: proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)]
[mount: udev on /dev type devtmpfs (rw,nosuid,relatime,size=32838948k,nr_inodes=8209737,mode=755,inode64)]
[mount: devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)]
[mount: tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=6576300k,mode=755,inode64)]
[mount: /dev/nvme0n1p1 on / type ext4 (rw,relatime,errors=remount-ro)]
[mount: securityfs on /sys/kernel/security type securityfs (rw,nosuid,nodev,noexec,relatime)]
[mount: tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,inode64)]
[mount: tmpfs on /run/lock type tmpfs (rw,nosuid,nodev,noexec,relatime,size=5120k,inode64)]
[mount: cgroup2 on /sys/fs/cgroup type cgroup2 (rw,nosuid,nodev,noexec,relatime,nsdelegate,memory_recursiveprot)]
[mount: pstore on /sys/fs/pstore type pstore (rw,nosuid,nodev,noexec,relatime)]
[mount: efivarfs on /sys/firmware/efi/efivars type efivarfs (rw,nosuid,nodev,noexec,relatime)]
[mount: bpf on /sys/fs/bpf type bpf (rw,nosuid,nodev,noexec,relatime,mode=700)]
[mount: systemd-1 on /proc/sys/fs/binfmt_misc type autofs (rw,relatime,fd=32,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=8090)]
[mount: hugetlbfs on /dev/hugepages type hugetlbfs (rw,nosuid,nodev,relatime,pagesize=2M)]
[mount: mqueue on /dev/mqueue type mqueue (rw,nosuid,nodev,noexec,relatime)]
[mount: debugfs on /sys/kernel/debug type debugfs (rw,nosuid,nodev,noexec,relatime)]
[mount: tracefs on /sys/kernel/tracing type tracefs (rw,nosuid,nodev,noexec,relatime)]
[mount: fusectl on /sys/fs/fuse/connections type fusectl (rw,nosuid,nodev,noexec,relatime)]
[mount: configfs on /sys/kernel/config type configfs (rw,nosuid,nodev,noexec,relatime)]
[mount: tmpfs on /run/qemu type tmpfs (rw,nosuid,nodev,relatime,mode=755,inode64)]
[mount: /var/lib/snapd/snaps/bare_5.snap on /snap/bare/5 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/core20_2582.snap on /snap/core20/2582 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/core20_2599.snap on /snap/core20/2599 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/core22_2010.snap on /snap/core22/2010 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/core22_2045.snap on /snap/core22/2045 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/firefox_6495.snap on /snap/firefox/6495 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/firefox_6565.snap on /snap/firefox/6565 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/firmware-updater_147.snap on /snap/firmware-updater/147 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/firmware-updater_167.snap on /snap/firmware-updater/167 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/gnome-3-38-2004_143.snap on /snap/gnome-3-38-2004/143 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/gnome-42-2204_176.snap on /snap/gnome-42-2204/176 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/gnome-42-2204_202.snap on /snap/gnome-42-2204/202 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/gtk-common-themes_1535.snap on /snap/gtk-common-themes/1535 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/nvim_4015.snap on /snap/nvim/4015 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/nvim_4044.snap on /snap/nvim/4044 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/slack_196.snap on /snap/slack/196 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/slack_209.snap on /snap/slack/209 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/snap-store_1248.snap on /snap/snap-store/1248 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/snap-store_1270.snap on /snap/snap-store/1270 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/snapd_24718.snap on /snap/snapd/24718 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/snapd_24792.snap on /snap/snapd/24792 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/snapd-desktop-integration_253.snap on /snap/snapd-desktop-integration/253 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/snapd-desktop-integration_315.snap on /snap/snapd-desktop-integration/315 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /var/lib/snapd/snaps/thunderbird_737.snap on /snap/thunderbird/737 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /dev/nvme0n1p1 on /var/snap/firefox/common/host-hunspell type ext4 (ro,noexec,noatime,errors=remount-ro)]
[mount: /var/lib/snapd/snaps/thunderbird_751.snap on /snap/thunderbird/751 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)]
[mount: /dev/sda1 on /boot/efi type vfat (rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro)]
[mount: binfmt_misc on /proc/sys/fs/binfmt_misc type binfmt_misc (rw,nosuid,nodev,noexec,relatime)]
[mount: tmpfs on /run/snapd/ns type tmpfs (rw,nosuid,nodev,noexec,relatime,size=6576300k,mode=755,inode64)]
[mount: nsfs on /run/snapd/ns/snapd-desktop-integration.mnt type nsfs (rw)]
[mount: overlay on /var/lib/docker/overlay2/76e1aae9a6e8dd00757515ee674e1c47a046bd2e9c72ae2623e191e5dd854f86/merged type overlay (rw,relatime,lowerdir=/var/lib/docker/overlay2/l/SZ4ONUSPGWBGLLBANE6I2UGS3L:/var/lib/docker/overlay2/l/EA3Q7I35YNCJFH6FTLVF23QRP7:/var/lib/docker/overlay2/l/DYPCXASXKZ5NFCH6GK4LZFQYUP:/var/lib/docker/overlay2/l/XS2BGU4DYMLZUSR7WK7GIEWQSH:/var/lib/docker/overlay2/l/IZXL3XAKYNT2MBR6A6NCZ22IIA,upperdir=/var/lib/docker/overlay2/76e1aae9a6e8dd00757515ee674e1c47a046bd2e9c72ae2623e191e5dd854f86/diff,workdir=/var/lib/docker/overlay2/76e1aae9a6e8dd00757515ee674e1c47a046bd2e9c72ae2623e191e5dd854f86/work,nouserxattr)]
[mount: nsfs on /run/docker/netns/e8336e5d0065 type nsfs (rw)]
[mount: tmpfs on /run/user/1000 type tmpfs (rw,nosuid,nodev,relatime,size=6576296k,nr_inodes=1644074,mode=700,uid=1000,gid=1000,inode64)]
[mount: portal on /run/user/1000/doc type fuse.portal (rw,nosuid,nodev,relatime,user_id=1000,group_id=1000)]
[mount: overlay on /var/lib/docker/overlay2/e2a128276e4042489e465af86b55b2efce8720240012b090ea13aff878cf9401/merged type overlay (rw,relatime,lowerdir=/var/lib/docker/overlay2/l/7F6JHEFE6TOLWSDWG3ZAZGB7D5:/var/lib/docker/overlay2/l/6PRXM5UH7AHSIQINJAOMYTWS5I:/var/lib/docker/overlay2/l/ECBCTSWAMHDF5UGWRWLJ4NBYWS:/var/lib/docker/overlay2/l/ZHCVR45RL4C2OXFCERT5UHYLQ3:/var/lib/docker/overlay2/l/MUZ3G6ABSTYRCCLILPNZV2OG2Z,upperdir=/var/lib/docker/overlay2/e2a128276e4042489e465af86b55b2efce8720240012b090ea13aff878cf9401/diff,workdir=/var/lib/docker/overlay2/e2a128276e4042489e465af86b55b2efce8720240012b090ea13aff878cf9401/work,nouserxattr)]
[mount: nsfs on /run/docker/netns/aa2e64278089 type nsfs (rw)]
[mount: nsfs on /run/snapd/ns/firmware-updater.mnt type nsfs (rw)]
[mount: gvfsd-fuse on /run/user/1000/gvfs type fuse.gvfsd-fuse (rw,nosuid,nodev,relatime,user_id=1000,group_id=1000)]
Simple syscall: 0.1303 microseconds
Simple read: 0.2135 microseconds
Simple write: 0.1963 microseconds
Simple stat: 1.0156 microseconds
Simple fstat: 0.3355 microseconds
Simple open/close: 1.8797 microseconds
Select on 10 fd's: 0.3807 microseconds
Select on 100 fd's: 1.1255 microseconds
Select on 250 fd's: 2.2851 microseconds
Select on 500 fd's: 4.3982 microseconds
Select on 10 tcp fd's: 0.4761 microseconds
Select on 100 tcp fd's: 3.8531 microseconds
Select on 250 tcp fd's: 9.6678 microseconds
Select on 500 tcp fd's: 19.4667 microseconds
Signal handler installation: 0.1879 microseconds
Signal handler overhead: 1.6441 microseconds
Protection fault: 0.2729 microseconds
Pipe latency: 8.0225 microseconds
AF_UNIX sock stream latency: 7.8963 microseconds
Process fork+exit: 178.2188 microseconds
Process fork+execve: 549.4000 microseconds
Process fork+/bin/sh -c: 1032.5000 microseconds
File /var/tmp/XXX write bandwidth: 899118 KB/sec

"mappings
0.524288 9.824
1.048576 16
2.097152 24
4.194304 44
8.388608 78
16.777216 152
33.554432 303
67.108864 565
134.217728 1131
268.435456 2253
536.870912 4542
1073.741824 9070
2147.483648 19102
4294.967296 41378

"File system latency
0k	469	84505	138552
1k	332	64142	109131
4k	330	65619	110566
10k	271	49834	88549

unable to register (XACT_PROG, XACT_VERS, udp).
UDP latency using localhost: 14.9026 microseconds
TCP latency using localhost: 17.5532 microseconds
localhost: RPC: Timed out
localhost: RPC: Remote system error - Connection refused
Segmentation fault (core dumped)
TCP/IP connection cost to localhost: 27.6802 microseconds

Socket bandwidth using localhost
0.000001 1.80 MB/sec
0.000064 98.34 MB/sec
0.000128 190.05 MB/sec
0.000256 362.07 MB/sec
0.000512 683.61 MB/sec
0.001024 1250.21 MB/sec
0.001437 1558.71 MB/sec
10.485760 6790.20 MB/sec

Avg xfer: 3.2KB, 41.8KB in 1.4040 millisecs, 29.75 MB/sec
AF_UNIX sock stream bandwidth: 8272.93 MB/sec
Pipe bandwidth: 3538.24 MB/sec

"read bandwidth
0.000512 671.66
0.001024 1291.46
0.002048 2509.23
0.004096 4778.17
0.008192 8039.19
0.016384 11730.20
0.032768 14304.81
0.065536 18061.66
0.131072 18706.87
0.262144 15004.23
0.524288 17993.09
1.05 17652.11
2.10 17933.96
4.19 17531.92
8.39 17941.80
16.78 16088.62
33.55 12069.94
67.11 10740.86
134.22 11058.56
268.44 9399.33
536.87 10197.37
1073.74 10587.39
2147.48 10571.19
4294.97 11481.44

"read open2close bandwidth
0.000512 195.54
0.001024 389.90
0.002048 745.30
0.004096 1513.48
0.008192 2834.84
0.016384 4891.50
0.032768 8074.74
0.065536 11862.74
0.131072 14332.68
0.262144 15969.37
0.524288 16742.95
1.05 17128.13
2.10 17540.86
4.19 17497.10
8.39 17634.24
16.78 17050.02
33.55 12432.17
67.11 10540.11
134.22 9995.36
268.44 9395.71
536.87 11240.55
1073.74 10491.70
2147.48 10806.15
4294.97 11531.94


"Mmap read bandwidth
0.000512 75456.70
0.001024 55887.65
0.002048 59165.43
0.004096 60071.20
0.008192 62933.02
0.016384 62271.73
0.032768 63224.22
0.065536 63435.26
0.131072 61317.62
0.262144 62548.04
0.524288 63179.92
1.05 62224.88
2.10 60675.70
4.19 61742.29
8.39 61800.52
16.78 62094.03
33.55 35056.00
67.11 27287.42
134.22 26097.17
268.44 23719.67
536.87 25256.19
1073.74 25159.73
2147.48 24970.16
4294.97 26263.29

"Mmap read open2close bandwidth
0.000512 72.18
0.001024 150.07
0.002048 285.48
0.004096 564.18
0.008192 1112.33
0.016384 2000.51
0.032768 3415.48
0.065536 5574.09
0.131072 6929.82
0.262144 8947.40
0.524288 10473.01
1.05 11857.89
2.10 12512.84
4.19 12856.68
8.39 13025.79
16.78 12998.04
33.55 10768.43
67.11 9465.28
134.22 9690.81
268.44 8493.18
536.87 7626.33
1073.74 8105.91
2147.48 8260.44
4294.97 8703.29


"libc bcopy unaligned
0.000512 114131.34
0.001024 140770.35
0.002048 144607.32
0.004096 144264.53
0.008192 149342.34
0.016384 136925.11
0.032768 74936.41
0.065536 72841.42
0.131072 74177.19
0.262144 67213.99
0.524288 59432.61
1.05 58243.29
2.10 59122.44
4.19 58678.01
8.39 56736.16
16.78 31847.41
33.55 24394.35
67.11 21317.94
134.22 17831.50
268.44 19200.02
536.87 18333.25
1073.74 18645.88
2147.48 18865.54

"libc bcopy aligned
0.000512 119363.56
0.001024 137959.83
0.002048 144551.79
0.004096 146928.85
0.008192 143809.45
0.016384 141575.29
0.032768 73452.70
0.065536 71806.30
0.131072 71951.71
0.262144 65202.12
0.524288 57928.47
1.05 59859.24
2.10 59160.90
4.19 57219.01
8.39 56524.95
16.78 31512.43
33.55 24398.79
67.11 21834.67
134.22 20585.54
268.44 19391.42
536.87 18547.33
1073.74 18709.89
2147.48 19124.61

Memory bzero bandwidth
0.000512 143081.85
0.001024 147277.97
0.002048 150377.88
0.004096 151096.81
0.008192 152033.58
0.016384 152168.51
0.032768 151602.22
0.065536 143490.60
0.131072 145910.34
0.262144 149639.22
0.524288 115312.89
1.05 101240.43
2.10 103660.01
4.19 102586.60
8.39 102988.85
16.78 97772.89
33.55 43176.66
67.11 24323.62
134.22 20038.48
268.44 18387.25
536.87 17274.39
1073.74 17246.37
2147.48 17367.72
4294.97 17408.27

"unrolled bcopy unaligned
0.000512 26891.73
0.001024 27516.42
0.002048 27917.50
0.004096 27924.32
0.008192 27956.97
0.016384 25860.80
0.032768 21239.37
0.065536 21853.14
0.131072 20670.58
0.262144 21154.48
0.524288 21278.76
1.05 21344.57
2.10 21577.93
4.19 21450.32
8.39 21556.63
16.78 18127.73
33.55 11438.36
67.11 10163.39
134.22 9449.96
268.44 9503.49
536.87 9603.79
1073.74 9601.55
2147.48 9642.64

"unrolled partial bcopy unaligned
0.000512 93376.47
0.001024 100477.56
0.002048 106307.44
0.004096 108083.10
0.008192 108959.61
0.016384 105127.20
0.032768 73898.51
0.065536 73956.96
0.131072 74470.00
0.262144 67879.92
0.524288 62743.74
1.05 61152.60
2.10 63189.48
4.19 62862.84
8.39 61141.46
16.78 30626.54
33.55 15609.13
67.11 13278.37
134.22 11787.96
268.44 11672.12
536.87 11702.40
1073.74 11792.49
2147.48 12548.33

Memory read bandwidth
0.000512 31592.35
0.001024 32467.87
0.002048 32365.11
0.004096 32290.07
0.008192 32360.56
0.016384 32254.79
0.032768 32442.67
0.065536 31858.93
0.131072 32079.08
0.262144 32118.54
0.524288 30730.91
1.05 31763.29
2.10 31763.57
4.19 29211.22
8.39 30780.91
16.78 31453.35
33.55 23705.00
67.11 22254.64
134.22 21895.22
268.44 21134.99
536.87 21460.24
1073.74 21123.34
2147.48 21503.44
4294.97 21848.22

Memory partial read bandwidth
0.000512 186271.78
0.001024 195116.93
0.002048 195291.40
0.004096 194219.76
0.008192 183856.18
0.016384 185433.79
0.032768 192756.36
0.065536 120455.76
0.131072 118926.24
0.262144 116356.21
0.524288 108347.22
1.05 96547.43
2.10 100932.45
4.19 99864.38
8.39 99917.64
16.78 96273.24
33.55 49029.31
67.11 32800.03
134.22 31184.42
268.44 29674.49
536.87 29446.63
1073.74 29774.88
2147.48 28923.12
4294.97 30076.38

Memory write bandwidth
0.000512 37931.53
0.001024 37978.97
0.002048 38003.44
0.004096 38045.39
0.008192 36835.10
0.016384 38040.98
0.032768 36271.09
0.065536 27086.28
0.131072 27522.78
0.262144 28157.46
0.524288 27332.55
1.05 26159.90
2.10 26274.11
4.19 27540.24
8.39 29353.60
16.78 25837.60
33.55 10874.88
67.11 6962.95
134.22 6451.84
268.44 6568.19
536.87 6615.38
1073.74 6608.33
2147.48 6648.12
4294.97 6754.69

Memory partial write bandwidth
0.000512 152549.12
0.001024 152320.62
0.002048 152660.08
0.004096 152322.98
0.008192 151588.71
0.016384 151196.69
0.032768 128572.69
0.065536 95970.30
0.131072 93022.97
0.262144 95977.24
0.524288 92577.17
1.05 91230.10
2.10 91578.69
4.19 90732.99
8.39 90391.00
16.78 90016.52
33.55 43248.21
67.11 23481.06
134.22 20164.92
268.44 18903.91
536.87 18154.09
1073.74 18244.47
2147.48 18207.19
4294.97 18103.74

Memory partial read/write bandwidth
0.000512 73592.60
0.001024 76088.92
0.002048 76199.14
0.004096 75998.28
0.008192 75874.06
0.016384 75405.13
0.032768 75543.47
0.065536 71964.12
0.131072 73981.16
0.262144 70321.02
0.524288 69067.88
1.05 70596.79
2.10 69917.94
4.19 69905.07
8.39 70144.19
16.78 68296.63
33.55 32445.86
67.11 22100.73
134.22 17311.72
268.44 18035.17
536.87 18059.44
1073.74 17872.17
2147.48 18251.91
4294.97 18380.17



"size=0k ovr=0.66
2 3.40
4 3.65
8 3.78
16 4.21
24 4.22
32 4.71
64 5.06
96 4.64

"size=4k ovr=0.74
2 3.54
4 3.62
8 4.01
16 4.14
24 4.76
32 4.30
64 4.57
96 4.47

"size=8k ovr=0.80
2 3.02
4 3.58
8 4.29
16 4.26
24 4.46
32 4.19
64 4.39
96 4.83

"size=16k ovr=0.93
2 3.84
4 3.73
8 3.87
16 4.78
24 4.59
32 4.08
64 5.07
96 4.71

"size=32k ovr=1.33
2 3.06
4 3.52
8 4.73
16 4.45
24 4.47
32 5.33
64 5.03
96 4.93

"size=64k ovr=1.76
2 3.08
4 3.67
8 3.93
16 4.68
24 5.40
32 4.07
64 5.06
96 6.66


[Wed Jul 30 06:17:19 AM JST 2025]
```
</details>
