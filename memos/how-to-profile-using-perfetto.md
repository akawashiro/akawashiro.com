---
title: How to profile using perfetto
layout: default
---

See [https://perfetto.dev/docs/quickstart/linux-tracing](https://perfetto.dev/docs/quickstart/linux-tracing).

```console
$ git clone https://android.googlesource.com/platform/external/perfetto/ && cd perfetto
$ tools/install-build-deps
$ tools/gn gen --args='is_debug=false' out/linux
$ tools/ninja -C out/linux tracebox traced traced_probes perfetto
$ # Rewrite scheduling.cfg
$ cat test/configs/scheduling.cfg
# One buffer allocated within the central tracing binary for the entire trace,
# shared by the two data sources below.
buffers {
  size_kb: 20480
  fill_policy: DISCARD
}

# Ftrace data from the kernel, mainly the process scheduling events.
data_sources {
  config {
    name: "linux.ftrace"
    target_buffer: 0
    ftrace_config {
      ftrace_events: "sched_switch"
      ftrace_events: "sched_waking"
      ftrace_events: "sched_wakeup_new"

      ftrace_events: "task_newtask"
      ftrace_events: "task_rename"

      ftrace_events: "sched_process_exec"
      ftrace_events: "sched_process_exit"
      ftrace_events: "sched_process_fork"
      ftrace_events: "sched_process_free"
      ftrace_events: "sched_process_hang"
      ftrace_events: "sched_process_wait"
    }
  }
}

# Resolve process commandlines and parent/child relationships, to better
# interpret the ftrace events, which are in terms of pids.
data_sources {
  config {
    name: "linux.process_stats"
    target_buffer: 0
  }
}

# Rewrite here!
duration_ms: 3200000
$ tools/tmux -c test/configs/scheduling.cfg -C out/linux -n
# Press C-c after hoge
```

Run your command in another terminal.
```
$ hoge
```
