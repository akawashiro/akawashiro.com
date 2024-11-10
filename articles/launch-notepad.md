---
title: Windows でのプロセスの起動
layout: default
---

# Windows でのプロセスの起動 <!-- omit in toc -->
この記事では Windows 上で `cmd.exe` (いわゆる「コマンドプロンプト」です) から `notepad.exe` (「メモ帳」です) を起動した際に起きることを観察します。

## 注意 <!-- omit in toc -->

Windows はソースコードが公開されていないため、内部の詳細な挙動についてはどうしても断言できません。このため、この記事は歯切れの悪い点が多数あります。

- [準備](#準備)
- [CreateProcessW の呼び出し](#createprocessw-の呼び出し)
- [Notepad.exe プロセスの開始](#notepadexe-プロセスの開始)
- [Notepad.exe のメモリへの読み込み](#notepadexe-のメモリへの読み込み)
- [その後の Image の読み込み](#その後の-image-の読み込み)
- [終わりに](#終わりに)
- [参考](#参考)


## 準備

Process monitor を使って `cmd.exe` と `notepad.exe` の挙動を監視できる状態にします。
具体的には，Process monitor に `cmd.exe` と `notepad.exe` の Include フィルタを設定します。
以下の画像のように入力することで `cmd.exe` の挙動を監視できるようになります。

<img src="monitor_cmd_exe.png" width="40%">

このような設定をした上で、`cmd.exe` から `notepad.exe` を起動すると以下のような状態になります。

<img src="process_monitor.png" width="100%">

## CreateProcessW の呼び出し

`notepad.exe` の起動は `cmd.exe` から `CreateProcessW` を呼び出すところから始まります。
下の画像で青く選択されているイベントです。

<img src="process_monitor.png" width="100%">

個々のイベントをダブルクリックするとその詳細を見ることができます。
画像のまま見てもよいのですが、右下に `Copy All` ボタンを見つけたのでここからこのボタンを使ってコピーした内容を紹介します。

<img src="process_create_event.png" width="70%">

上のウィンドウでStackタブに切り替えた結果が以下です。

```
0	ntoskrnl.exe	MmGetSectionInformation + 0x1498	0xfffff80164f90bf8	C:\Windows\system32\ntoskrnl.exe
1	ntoskrnl.exe	LpcRequestPort + 0x2f27	0xfffff80164ee9bb7	C:\Windows\system32\ntoskrnl.exe
2	ntoskrnl.exe	FsRtlFreeExtraCreateParameter + 0xade	0xfffff80164e8464e	C:\Windows\system32\ntoskrnl.exe
3	ntoskrnl.exe	setjmpex + 0x90d8	0xfffff80164c2a408	C:\Windows\system32\ntoskrnl.exe
4	ntdll.dll	NtCreateUserProcess + 0x14	0x7ffe47571aa4	C:\Windows\SYSTEM32\ntdll.dll
5	KERNELBASE.dll	CreateProcessInternalW + 0x2464	0x7ffe44e07624	C:\Windows\System32\KERNELBASE.dll
6	KERNELBASE.dll	CreateProcessW + 0x66	0x7ffe44e3eab6	C:\Windows\System32\KERNELBASE.dll
7	KERNEL32.DLL	CreateProcessW + 0x54	0x7ffe470261f4	C:\Windows\System32\KERNEL32.DLL
8	cmd.exe	cmd.exe + 0x19d3f	0x7ff681df9d3f	C:\Windows\system32\cmd.exe
9	cmd.exe	cmd.exe + 0xd213	0x7ff681ded213	C:\Windows\system32\cmd.exe
10	cmd.exe	cmd.exe + 0x10d8d	0x7ff681df0d8d	C:\Windows\system32\cmd.exe
11	cmd.exe	cmd.exe + 0xfe03	0x7ff681defe03	C:\Windows\system32\cmd.exe
12	cmd.exe	cmd.exe + 0x25c87	0x7ff681e05c87	C:\Windows\system32\cmd.exe
13	cmd.exe	cmd.exe + 0x1f876	0x7ff681dff876	C:\Windows\system32\cmd.exe
14	KERNEL32.DLL	BaseThreadInitThunk + 0x1d	0x7ffe4702257d	C:\Windows\System32\KERNEL32.DLL
15	ntdll.dll	RtlUserThreadStart + 0x28	0x7ffe4752af08	C:\Windows\SYSTEM32\ntdll.dll
```

ここには `cmd.exe` が [CreateProcessW](https://learn.microsoft.com/ja-jp/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw) を呼び出して `notepad.exe` のためのプロセスを作った際のスタックトレースが表示されており、
`cmd.exe` が最終的にカーネル (`ntoskrnlexe`)の機能を呼び出すまでに、`KERNEL32.DLL`、`KERNELBASE.dll`、`ntdll.dll`の 3つの DLL を経由することがわかります。
ここからは、このコールスタックを下から、つまり Notepad.exe 側から詳細に見ていきます。

[CreateProcessW](https://learn.microsoft.com/ja-jp/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw) とは新しいプロセスとそのプライマリ スレッドを作成する Win32 API の一つです。
選択しているイベントの直後に、`Process Start`と`Thread Create`の文字列が見えますが、これらがそれぞれ、新しいプロセスとそのプライマリスレッドに対応しているように見えます。

[NtCreateUserProcess](https://j00ru.vexillium.org/syscalls/nt/64/) とは Windows の system call の一つであり、[https://j00ru.vexillium.org/syscalls/nt/64/](https://j00ru.vexillium.org/syscalls/nt/64/) で実際に system call の番号を調べることができます。Linux ユーザに向けて特筆すべきなのは、この番号が Windows のバージョンで変化する点です。これは静的リンクしたバイナリの互換性が Windows のバージョンをまたいで保たれないことを意味するはずです。

興味深いことに、ユーザ空間からカーネル空間に遷移する際に `3	ntoskrnl.exe	setjmpex + 0x90d8	0xfffff80164c2a408	C:\Windows\system32\ntoskrnl.exe` を経由しており、`setjmpex` が呼び出されていることがわかります。
この `setjmpex` を呼び出す理由はわかっていませんが、カーネル内で処理が失敗した場合に `longjmp` で戻ることができるようにするためであろうと推測しています。

[FsRtlFreeExtraCreateParameter](https://learn.microsoft.com/ja-jp/windows-hardware/drivers/ddi/ntifs/nf-ntifs-fsrtlfreeextracreateparameter)、LpcRequestPort、MmGetSectionInformation については詳細がわかりませんでした。
ソースコードが公開されていないとこういう点がつらいですね。

## Notepad.exe プロセスの開始

次は `Notepad.exe` の `Process start` イベントの内容を見ます。

<img src="start_notepad_exe_process.png" width="100%">

### Event タブ <!-- omit in toc -->

まず、Event タブからは環境変数、親プロセスの PID など Linux と同様の情報が渡されていることがわかります。

```
Date:	11/9/2024 6:17:25.4042993 PM
Thread:	11076
Class:	Process
Operation:	Process Start
Result:	SUCCESS
Path:	
Duration:	0.0000000
Parent PID:	3064
Command line:	notepad.exe
Current directory:	C:\Users\User\
Environment:	
	=::=::\
	=C:=C:\Users\User
	ALLUSERSPROFILE=C:\ProgramData
	APPDATA=C:\Users\User\AppData\Roaming
	CommonProgramFiles=C:\Program Files\Common Files
	CommonProgramFiles(x86)=C:\Program Files (x86)\Common Files
	CommonProgramW6432=C:\Program Files\Common Files
	COMPUTERNAME=WINDEV2407EVAL
	ComSpec=C:\Windows\system32\cmd.exe
	DriverData=C:\Windows\System32\Drivers\DriverData
	EFC_5640=1
	FPS_BROWSER_APP_PROFILE_STRING=Internet Explorer
	FPS_BROWSER_USER_PROFILE_STRING=Default
	HOMEDRIVE=C:
	HOMEPATH=\Users\User
	LOCALAPPDATA=C:\Users\User\AppData\Local
	LOGONSERVER=\\WINDEV2407EVAL
	NUMBER_OF_PROCESSORS=6
	OneDrive=C:\Users\User\OneDrive
	OS=Windows_NT
	Path=C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Windows\System32\OpenSSH\;C:\Program Files\Microsoft SQL Server\150\Tools\Binn\;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\;C:\Program Files\dotnet\;C:\Program Files (x86)\Windows Kits\10\Windows Performance Toolkit\;C:\Users\User\AppData\Local\Microsoft\WindowsApps;
	PATHEXT=.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC
	PROCESSOR_ARCHITECTURE=AMD64
	PROCESSOR_IDENTIFIER=AMD64 Family 25 Model 80 Stepping 0, AuthenticAMD
	PROCESSOR_LEVEL=25
	PROCESSOR_REVISION=5000
	ProgramData=C:\ProgramData
	ProgramFiles=C:\Program Files
	ProgramFiles(x86)=C:\Program Files (x86)
	ProgramW6432=C:\Program Files
	PROMPT=$P$G
	PSModulePath=C:\Program Files\WindowsPowerShell\Modules;C:\Windows\system32\WindowsPowerShell\v1.0\Modules
	PUBLIC=C:\Users\Public
	SESSIONNAME=Console
	SystemDrive=C:
	SystemRoot=C:\Windows
	TEMP=C:\Users\User\AppData\Local\Temp
	TMP=C:\Users\User\AppData\Local\Temp
	USERDOMAIN=WINDEV2407EVAL
	USERDOMAIN_ROAMINGPROFILE=WINDEV2407EVAL
	USERNAME=User
	USERPROFILE=C:\Users\User
	windir=C:\Windows
```

### Process タブ <!-- omit in toc -->

Process タブには PID などのほかに Auth ID という見慣れない情報が表示されています。
これは TODO です。
また、`Modules` という項目があり、プロセス内にロードされている `.exe` や `.dll` の一覧があります。
この時点では何も読み込まれていないため空となっています。

```
Description:	
Company:	
Name:	Notepad.exe
Version:	
Path:	C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\Notepad.exe
Command Line:	notepad.exe
PID:	9160
Parent PID:	3064
Session ID:	1
User:	WINDEV2407EVAL\User
Auth ID:	00000000:0003c5f2
Architecture:	64-bit
Virtualized:	False
Integrity:	Medium
Started:	11/9/2024 6:17:25 PM
Ended:	11/9/2024 6:17:25 PM
Modules:
```

### Stack タブ <!-- omit in toc -->

Stack タブを見るとカーネル (`ntoskrnl.exe`)以外の関数についてシンボルの情報が消えています。
しかし、良く見比べるとこれは [CreateProcessW の呼び出し](#createprocessw-の呼び出し) で見たアドレスと同一です。
シンボル名が消えてしまったのは、プロセス内に対応する`.dll`が読み込まれていないせいであると考えています。

```
0	ntoskrnl.exe	MmGetSectionInformation + 0x179e	0xfffff80164f90efe	C:\Windows\system32\ntoskrnl.exe
1	ntoskrnl.exe	LpcRequestPort + 0x2c8c	0xfffff80164ee991c	C:\Windows\system32\ntoskrnl.exe
2	ntoskrnl.exe	FsRtlFreeExtraCreateParameter + 0xade	0xfffff80164e8464e	C:\Windows\system32\ntoskrnl.exe
3	ntoskrnl.exe	setjmpex + 0x90d8	0xfffff80164c2a408	C:\Windows\system32\ntoskrnl.exe
4	<unknown>	0x7ffe47571aa4	0x7ffe47571aa4	
5	<unknown>	0x7ffe44e07624	0x7ffe44e07624	
6	<unknown>	0x7ffe44e3eab6	0x7ffe44e3eab6	
7	<unknown>	0x7ffe470261f4	0x7ffe470261f4	
8	<unknown>	0x7ff681df9d3f	0x7ff681df9d3f	
9	<unknown>	0x7ff681ded213	0x7ff681ded213	
10	<unknown>	0x7ff681df0d8d	0x7ff681df0d8d	
11	<unknown>	0x7ff681defe03	0x7ff681defe03	
12	<unknown>	0x7ff681e05c87	0x7ff681e05c87	
13	<unknown>	0x7ff681dff876	0x7ff681dff876	
14	<unknown>	0x7ffe4702257d	0x7ffe4702257d	
15	<unknown>	0x7ffe4752af08	0x7ffe4752af08	
```

## Notepad.exe のメモリへの読み込み

プロセスを起動した後は、各種 Image (`.exe` と `.dll`) の読み込みが始まります。
まず、`notepad.exe` 本体をメモリ上に展開します。

<img src="load_notepad_exe.png" width="100%">

読み込みが完了すると `Process` タブの `Modeuls` に読み込まれた Image が追加されます。

```
Description:	
Company:	
Name:	Notepad.exe
Version:	
Path:	C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\Notepad.exe
Command Line:	notepad.exe
PID:	9160
Parent PID:	3064
Session ID:	1
User:	WINDEV2407EVAL\User
Auth ID:	00000000:0003c5f2
Architecture:	64-bit
Virtualized:	False
Integrity:	Medium
Started:	11/9/2024 6:17:25 PM
Ended:	11/9/2024 6:17:25 PM
Modules:
Notepad.exe	0x7ff6cec10000	0x1aa000	C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\Notepad.exe			10/8/2024 5:38:54 PM
```

## その後の Image の読み込み

`notepad.exe` の後は様々な Image が読み込まれていきます。
非常に長いので折りたたんでおきますが、`ntdll.dll`、`kernel32.dll`、`KernelBase.dll` などの基本的なものからメモリ上に読み込まれていくようです。
更に憶測を書くと、最初に`ntdll.dll`を読み込んでいくことから、依存関係の葉になる DLL から読み込んでいくと考えられます。

<details>

```
"Time of Day","Process Name","PID","Operation","Path","Result","Detail"
"6:17:25.4395810 PM","Notepad.exe","9160","Load Image","C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\Notepad.exe","SUCCESS","Image Base: 0x7ff6cec10000, Image Size: 0x1aa000"
"6:17:25.4396664 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\ntdll.dll","SUCCESS","Image Base: 0x7ffe474d0000, Image Size: 0x217000"
"6:17:25.4410976 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\kernel32.dll","SUCCESS","Image Base: 0x7ffe47010000, Image Size: 0xc4000"
"6:17:25.4412640 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\KernelBase.dll","SUCCESS","Image Base: 0x7ffe44dc0000, Image Size: 0x3b7000"
"6:17:25.4429280 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\shlwapi.dll","SUCCESS","Image Base: 0x7ffe45f60000, Image Size: 0x5e000"
"6:17:25.4431344 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\msvcrt.dll","SUCCESS","Image Base: 0x7ffe45570000, Image Size: 0xa7000"
"6:17:25.4433552 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\user32.dll","SUCCESS","Image Base: 0x7ffe45200000, Image Size: 0x1af000"
"6:17:25.4435915 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\win32u.dll","SUCCESS","Image Base: 0x7ffe44b30000, Image Size: 0x26000"
"6:17:25.4438495 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\gdi32.dll","SUCCESS","Image Base: 0x7ffe47460000, Image Size: 0x29000"
"6:17:25.4440614 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\gdi32full.dll","SUCCESS","Image Base: 0x7ffe44950000, Image Size: 0x118000"
"6:17:25.4442536 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\msvcp_win.dll","SUCCESS","Image Base: 0x7ffe44d20000, Image Size: 0x9a000"
"6:17:25.4444512 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\ucrtbase.dll","SUCCESS","Image Base: 0x7ffe44c00000, Image Size: 0x111000"
"6:17:25.4447454 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\shell32.dll","SUCCESS","Image Base: 0x7ffe456b0000, Image Size: 0x869000"
"6:17:25.4449092 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\ole32.dll","SUCCESS","Image Base: 0x7ffe46e60000, Image Size: 0x1a5000"
"6:17:25.4451357 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\combase.dll","SUCCESS","Image Base: 0x7ffe467b0000, Image Size: 0x38e000"
"6:17:25.4453991 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\rpcrt4.dll","SUCCESS","Image Base: 0x7ffe46ca0000, Image Size: 0x114000"
"6:17:25.4455542 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\advapi32.dll","SUCCESS","Image Base: 0x7ffe46540000, Image Size: 0xb2000"
"6:17:25.4456617 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\sechost.dll","SUCCESS","Image Base: 0x7ffe46600000, Image Size: 0xa8000"
"6:17:25.4458609 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\bcrypt.dll","SUCCESS","Image Base: 0x7ffe44b60000, Image Size: 0x28000"
"6:17:25.4460435 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\crypt32.dll","SUCCESS","Image Base: 0x7ffe447e0000, Image Size: 0x166000"
"6:17:25.4462462 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\comdlg32.dll","SUCCESS","Image Base: 0x7ffe46440000, Image Size: 0xff000"
"6:17:25.4463804 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\SHCore.dll","SUCCESS","Image Base: 0x7ffe47200000, Image Size: 0xf9000"
"6:17:25.4468025 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\oleaut32.dll","SUCCESS","Image Base: 0x7ffe46b40000, Image Size: 0xd7000"
"6:17:25.4473443 PM","Notepad.exe","9160","Load Image","C:\Windows\WinSxS\amd64_microsoft.windows.common-controls_6595b64144ccf1df_6.0.22621.3672_none_2713b9d173822955\comctl32.dll","SUCCESS","Image Base: 0x7ffe2b7a0000, Image Size: 0x293000"
"6:17:25.4474223 PM","Notepad.exe","9160","Load Image","C:\Windows\WinSxS\amd64_microsoft.windows.common-controls_6595b64144ccf1df_6.0.22621.3672_none_2713b9d173822955\comctl32.dll","SUCCESS","Image Base: 0x1bc3ee10000, Image Size: 0x293000"
"6:17:25.4498419 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\propsys.dll","SUCCESS","Image Base: 0x7ffe40a50000, Image Size: 0x101000"
"6:17:25.4507875 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\urlmon.dll","SUCCESS","Image Base: 0x7ffe37d90000, Image Size: 0x1f0000"
"6:17:25.4523558 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\winspool.drv","SUCCESS","Image Base: 0x7ffe2d460000, Image Size: 0xa7000"
"6:17:25.4523891 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\icu.dll","SUCCESS","Image Base: 0x7ffe1fb80000, Image Size: 0x270000"
"6:17:25.4533417 PM","Notepad.exe","9160","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\msvcp140_atomic_wait.dll","SUCCESS","Image Base: 0x7ffe3b100000, Image Size: 0x14000"
"6:17:25.4533420 PM","Notepad.exe","9160","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\msvcp140.dll","SUCCESS","Image Base: 0x7ffdffe00000, Image Size: 0x8d000"
"6:17:25.4538735 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\dwmapi.dll","SUCCESS","Image Base: 0x7ffe41e90000, Image Size: 0x2b000"
"6:17:25.4542533 PM","Notepad.exe","9160","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\vcruntime140.dll","SUCCESS","Image Base: 0x7ffdffe90000, Image Size: 0x1e000"
"6:17:25.4543211 PM","Notepad.exe","9160","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\vcruntime140_1.dll","SUCCESS","Image Base: 0x7ffe1e1f0000, Image Size: 0xc000"
"6:17:25.4544452 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\uxtheme.dll","SUCCESS","Image Base: 0x7ffe41be0000, Image Size: 0xb1000"
"6:17:25.4580388 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\iertutil.dll","SUCCESS","Image Base: 0x7ffe379f0000, Image Size: 0x2be000"
"6:17:25.4586752 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\srvcli.dll","SUCCESS","Image Base: 0x7ffe379c0000, Image Size: 0x28000"
"6:17:25.4588170 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\netutils.dll","SUCCESS","Image Base: 0x7ffe43250000, Image Size: 0xc000"
"6:17:25.4638454 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\imm32.dll","SUCCESS","Image Base: 0x7ffe46dc0000, Image Size: 0x31000"
"6:17:25.4740391 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\kernel.appcore.dll","SUCCESS","Image Base: 0x7ffe437f0000, Image Size: 0x18000"
"6:17:25.4744551 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\bcryptprimitives.dll","SUCCESS","Image Base: 0x7ffe45180000, Image Size: 0x7b000"
"6:17:25.4752077 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\clbcatq.dll","SUCCESS","Image Base: 0x7ffe470f0000, Image Size: 0xb0000"
"6:17:25.4772337 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\MrmCoreR.dll","SUCCESS","Image Base: 0x7ffe35e90000, Image Size: 0x116000"
"6:17:25.4787096 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\Windows.StateRepositoryClient.dll","SUCCESS","Image Base: 0x7ffe38c70000, Image Size: 0x3d000"
"6:17:25.4797918 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\Windows.StateRepositoryCore.dll","SUCCESS","Image Base: 0x7ffe38d60000, Image Size: 0x1a000"
"6:17:25.4989647 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\profapi.dll","SUCCESS","Image Base: 0x7ffe44710000, Image Size: 0x27000"
"6:17:25.5005249 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\AppXDeploymentClient.dll","SUCCESS","Image Base: 0x7ffe39690000, Image Size: 0x144000"
"6:17:25.5033899 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\Windows.UI.dll","SUCCESS","Image Base: 0x7ffe35080000, Image Size: 0x179000"
"6:17:25.5075642 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\BCP47mrm.dll","SUCCESS","Image Base: 0x7ffe34bf0000, Image Size: 0x32000"
"6:17:25.5179066 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\twinapi.appcore.dll","SUCCESS","Image Base: 0x7ffe3bdc0000, Image Size: 0x2a2000"
"6:17:25.5202394 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\WinTypes.dll","SUCCESS","Image Base: 0x7ffe425c0000, Image Size: 0x13f000"
"6:17:25.5234651 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\daxexec.dll","SUCCESS","Image Base: 0x7ffe2e0e0000, Image Size: 0x118000"
"6:17:25.5266836 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\container.dll","SUCCESS","Image Base: 0x7ffe2dec0000, Image Size: 0x44000"
"6:17:25.5267832 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\userenv.dll","SUCCESS","Image Base: 0x7ffe43cf0000, Image Size: 0x28000"
"6:17:25.5295790 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\ntmarta.dll","SUCCESS","Image Base: 0x7ffe43900000, Image Size: 0x34000"
"6:17:25.5318905 PM","Notepad.exe","9160","Load Image","C:\Windows\System32\capauthz.dll","SUCCESS","Image Base: 0x7ffe2e870000, Image Size: 0x60000"
"6:17:25.5400752 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\Notepad.exe","SUCCESS","Image Base: 0x7ff6cec10000, Image Size: 0x1aa000"
"6:17:25.5401655 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ntdll.dll","SUCCESS","Image Base: 0x7ffe474d0000, Image Size: 0x217000"
"6:17:25.5414237 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\kernel32.dll","SUCCESS","Image Base: 0x7ffe47010000, Image Size: 0xc4000"
"6:17:25.5415898 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\KernelBase.dll","SUCCESS","Image Base: 0x7ffe44dc0000, Image Size: 0x3b7000"
"6:17:25.5432778 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\shlwapi.dll","SUCCESS","Image Base: 0x7ffe45f60000, Image Size: 0x5e000"
"6:17:25.5435118 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\msvcrt.dll","SUCCESS","Image Base: 0x7ffe45570000, Image Size: 0xa7000"
"6:17:25.5438505 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\user32.dll","SUCCESS","Image Base: 0x7ffe45200000, Image Size: 0x1af000"
"6:17:25.5440887 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\win32u.dll","SUCCESS","Image Base: 0x7ffe44b30000, Image Size: 0x26000"
"6:17:25.5444493 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\gdi32.dll","SUCCESS","Image Base: 0x7ffe47460000, Image Size: 0x29000"
"6:17:25.5447160 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\gdi32full.dll","SUCCESS","Image Base: 0x7ffe44950000, Image Size: 0x118000"
"6:17:25.5448743 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\msvcp_win.dll","SUCCESS","Image Base: 0x7ffe44d20000, Image Size: 0x9a000"
"6:17:25.5450180 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ucrtbase.dll","SUCCESS","Image Base: 0x7ffe44c00000, Image Size: 0x111000"
"6:17:25.5453164 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\shell32.dll","SUCCESS","Image Base: 0x7ffe456b0000, Image Size: 0x869000"
"6:17:25.5454996 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ole32.dll","SUCCESS","Image Base: 0x7ffe46e60000, Image Size: 0x1a5000"
"6:17:25.5457209 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\combase.dll","SUCCESS","Image Base: 0x7ffe467b0000, Image Size: 0x38e000"
"6:17:25.5459302 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\rpcrt4.dll","SUCCESS","Image Base: 0x7ffe46ca0000, Image Size: 0x114000"
"6:17:25.5461363 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\advapi32.dll","SUCCESS","Image Base: 0x7ffe46540000, Image Size: 0xb2000"
"6:17:25.5462687 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\sechost.dll","SUCCESS","Image Base: 0x7ffe46600000, Image Size: 0xa8000"
"6:17:25.5464297 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\bcrypt.dll","SUCCESS","Image Base: 0x7ffe44b60000, Image Size: 0x28000"
"6:17:25.5467506 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\crypt32.dll","SUCCESS","Image Base: 0x7ffe447e0000, Image Size: 0x166000"
"6:17:25.5469890 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\comdlg32.dll","SUCCESS","Image Base: 0x7ffe46440000, Image Size: 0xff000"
"6:17:25.5472905 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\SHCore.dll","SUCCESS","Image Base: 0x7ffe47200000, Image Size: 0xf9000"
"6:17:25.5476356 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\oleaut32.dll","SUCCESS","Image Base: 0x7ffe46b40000, Image Size: 0xd7000"
"6:17:25.5481757 PM","Notepad.exe","7592","Load Image","C:\Windows\WinSxS\amd64_microsoft.windows.common-controls_6595b64144ccf1df_6.0.22621.3672_none_2713b9d173822955\comctl32.dll","SUCCESS","Image Base: 0x7ffe2b7a0000, Image Size: 0x293000"
"6:17:25.5484907 PM","Notepad.exe","7592","Load Image","C:\Windows\WinSxS\amd64_microsoft.windows.common-controls_6595b64144ccf1df_6.0.22621.3672_none_2713b9d173822955\comctl32.dll","SUCCESS","Image Base: 0x2314cae0000, Image Size: 0x293000"
"6:17:25.5502899 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\urlmon.dll","SUCCESS","Image Base: 0x7ffe37d90000, Image Size: 0x1f0000"
"6:17:25.5511017 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\propsys.dll","SUCCESS","Image Base: 0x7ffe40a50000, Image Size: 0x101000"
"6:17:25.5520419 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\icu.dll","SUCCESS","Image Base: 0x7ffe1fb80000, Image Size: 0x270000"
"6:17:25.5522259 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\winspool.drv","SUCCESS","Image Base: 0x7ffe2d460000, Image Size: 0xa7000"
"6:17:25.5526035 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\msvcp140.dll","SUCCESS","Image Base: 0x7ffdffe00000, Image Size: 0x8d000"
"6:17:25.5528314 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\msvcp140_atomic_wait.dll","SUCCESS","Image Base: 0x7ffe3b100000, Image Size: 0x14000"
"6:17:25.5535383 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\vcruntime140_1.dll","SUCCESS","Image Base: 0x7ffe1e1f0000, Image Size: 0xc000"
"6:17:25.5536002 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00.UWPDesktop_14.0.33728.0_x64__8wekyb3d8bbwe\vcruntime140.dll","SUCCESS","Image Base: 0x7ffdffe90000, Image Size: 0x1e000"
"6:17:25.5537928 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\dwmapi.dll","SUCCESS","Image Base: 0x7ffe41e90000, Image Size: 0x2b000"
"6:17:25.5543140 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\uxtheme.dll","SUCCESS","Image Base: 0x7ffe41be0000, Image Size: 0xb1000"
"6:17:25.5564800 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\iertutil.dll","SUCCESS","Image Base: 0x7ffe379f0000, Image Size: 0x2be000"
"6:17:25.5579362 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\netutils.dll","SUCCESS","Image Base: 0x7ffe43250000, Image Size: 0xc000"
"6:17:25.5581109 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\srvcli.dll","SUCCESS","Image Base: 0x7ffe379c0000, Image Size: 0x28000"
"6:17:25.5613061 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\imm32.dll","SUCCESS","Image Base: 0x7ffe46dc0000, Image Size: 0x31000"
"6:17:25.5683636 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\kernel.appcore.dll","SUCCESS","Image Base: 0x7ffe437f0000, Image Size: 0x18000"
"6:17:25.5687416 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\bcryptprimitives.dll","SUCCESS","Image Base: 0x7ffe45180000, Image Size: 0x7b000"
"6:17:25.5693262 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\clbcatq.dll","SUCCESS","Image Base: 0x7ffe470f0000, Image Size: 0xb0000"
"6:17:25.5704707 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\MrmCoreR.dll","SUCCESS","Image Base: 0x7ffe35e90000, Image Size: 0x116000"
"6:17:25.5716413 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.StateRepositoryClient.dll","SUCCESS","Image Base: 0x7ffe38c70000, Image Size: 0x3d000"
"6:17:25.5722757 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.StateRepositoryCore.dll","SUCCESS","Image Base: 0x7ffe38d60000, Image Size: 0x1a000"
"6:17:25.5898501 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\profapi.dll","SUCCESS","Image Base: 0x7ffe44710000, Image Size: 0x27000"
"6:17:25.5912980 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\AppXDeploymentClient.dll","SUCCESS","Image Base: 0x7ffe39690000, Image Size: 0x144000"
"6:17:25.5937275 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.UI.dll","SUCCESS","Image Base: 0x7ffe35080000, Image Size: 0x179000"
"6:17:25.5967177 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\BCP47mrm.dll","SUCCESS","Image Base: 0x7ffe34bf0000, Image Size: 0x32000"
"6:17:25.6047814 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\twinapi.appcore.dll","SUCCESS","Image Base: 0x7ffe3bdc0000, Image Size: 0x2a2000"
"6:17:25.6067268 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\WinTypes.dll","SUCCESS","Image Base: 0x7ffe425c0000, Image Size: 0x13f000"
"6:17:25.6143799 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\NotepadXamlUI.dll","SUCCESS","Image Base: 0x7ffe0c2c0000, Image Size: 0x471000"
"6:17:25.6168902 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\DWrite.dll","SUCCESS","Image Base: 0x7ffe3e5a0000, Image Size: 0x273000"
"6:17:25.6177801 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00_14.0.33519.0_x64__8wekyb3d8bbwe\msvcp140_app.dll","SUCCESS","Image Base: 0x7ffe259e0000, Image Size: 0x8c000"
"6:17:25.6178065 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00_14.0.33519.0_x64__8wekyb3d8bbwe\vcruntime140_app.dll","SUCCESS","Image Base: 0x7ffe25ea0000, Image Size: 0x1d000"
"6:17:25.6178899 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.VCLibs.140.00_14.0.33519.0_x64__8wekyb3d8bbwe\vcruntime140_1_app.dll","SUCCESS","Image Base: 0x7ffe25ec0000, Image Size: 0xc000"
"6:17:25.6198880 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.UI.Xaml.dll","SUCCESS","Image Base: 0x7ffe33860000, Image Size: 0x1225000"
"6:17:25.6219774 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\powrprof.dll","SUCCESS","Image Base: 0x7ffe446c0000, Image Size: 0x4d000"
"6:17:25.6220350 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ntmarta.dll","SUCCESS","Image Base: 0x7ffe43900000, Image Size: 0x34000"
"6:17:25.6232111 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\umpdc.dll","SUCCESS","Image Base: 0x7ffe446a0000, Image Size: 0x13000"
"6:17:25.6317525 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\OneCoreUAPCommonProxyStub.dll","SUCCESS","Image Base: 0x7ffe3b2f0000, Image Size: 0x62c000"
"6:17:25.6334658 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\msptls.dll","SUCCESS","Image Base: 0x7ffe308e0000, Image Size: 0x1af000"
"6:17:25.6340523 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2409.9.0_x64__8wekyb3d8bbwe\Notepad\riched20.dll","SUCCESS","Image Base: 0x7ffe100b0000, Image Size: 0x33d000"
"6:17:25.6367326 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\oleacc.dll","SUCCESS","Image Base: 0x7ffe298c0000, Image Size: 0x69000"
"6:17:25.6393696 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.Storage.ApplicationData.dll","SUCCESS","Image Base: 0x7ffe260b0000, Image Size: 0x67000"
"6:17:25.6477026 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\windows.storage.dll","SUCCESS","Image Base: 0x7ffe42700000, Image Size: 0x8ff000"
"6:17:25.6642676 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\InputHost.dll","SUCCESS","Image Base: 0x7ffe32800000, Image Size: 0x213000"
"6:17:25.6654833 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\CoreMessaging.dll","SUCCESS","Image Base: 0x7ffe3ff50000, Image Size: 0x133000"
"6:17:25.6691851 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\cryptbase.dll","SUCCESS","Image Base: 0x7ffe43f80000, Image Size: 0xc000"
"6:17:25.6734287 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\msctf.dll","SUCCESS","Image Base: 0x7ffe47300000, Image Size: 0x160000"
"6:17:25.6791635 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\UiaManager.dll","SUCCESS","Image Base: 0x7ffe2e770000, Image Size: 0xf1000"
"6:17:25.6907260 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\WindowManagementAPI.dll","SUCCESS","Image Base: 0x7ffe3ce00000, Image Size: 0x1f7000"
"6:17:25.6991061 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\dxgi.dll","SUCCESS","Image Base: 0x7ffe41d80000, Image Size: 0xf7000"
"6:17:25.7003201 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\DXCore.dll","SUCCESS","Image Base: 0x7ffe41f10000, Image Size: 0x37000"
"6:17:25.7013398 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ResourcePolicyClient.dll","SUCCESS","Image Base: 0x7ffe421b0000, Image Size: 0x15000"
"6:17:25.7042977 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\directxdatabasehelper.dll","SUCCESS","Image Base: 0x7ffe3dac0000, Image Size: 0x49000"
"6:17:25.7056869 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\dcomp.dll","SUCCESS","Image Base: 0x7ffe3faf0000, Image Size: 0x255000"
"6:17:25.7073690 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\d3d11.dll","SUCCESS","Image Base: 0x7ffe3ec10000, Image Size: 0x257000"
"6:17:25.7094129 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\d3d10warp.dll","SUCCESS","Image Base: 0x7ffe3c6e0000, Image Size: 0x713000"
"6:17:25.7105351 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.UI.Immersive.dll","SUCCESS","Image Base: 0x7ffe336e0000, Image Size: 0x175000"
"6:17:25.7149383 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\d2d1.dll","SUCCESS","Image Base: 0x7ffe3ee70000, Image Size: 0x5ee000"
"6:17:25.7164145 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\DataExchange.dll","SUCCESS","Image Base: 0x7ffe29860000, Image Size: 0x5e000"
"6:17:25.7192118 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\TextShaping.dll","SUCCESS","Image Base: 0x7ffe330e0000, Image Size: 0xb1000"
"6:17:25.7243309 PM","Notepad.exe","7592","Load Image","C:\Program Files\WindowsApps\Microsoft.UI.Xaml.2.8_8.2310.30001.0_x64__8wekyb3d8bbwe\Microsoft.UI.Xaml.dll","SUCCESS","Image Base: 0x7ffe10860000, Image Size: 0x5e3000"
"6:17:25.7407215 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.UI.Xaml.Controls.dll","SUCCESS","Image Base: 0x7ffe32a20000, Image Size: 0x410000"
"6:17:25.7426174 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\BCP47Langs.dll","SUCCESS","Image Base: 0x7ffe35250000, Image Size: 0x60000"
"6:17:25.7540244 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.ApplicationModel.dll","SUCCESS","Image Base: 0x7ffe2dae0000, Image Size: 0x100000"
"6:17:25.7641377 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.Globalization.dll","SUCCESS","Image Base: 0x7ffe33350000, Image Size: 0x1bb000"
"6:17:25.7674814 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.Globalization.Fontgroups.dll","SUCCESS","Image Base: 0x7ffe39c60000, Image Size: 0x15000"
"6:17:25.7691036 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\fontgroupsoverride.dll","SUCCESS","Image Base: 0x7ffe33340000, Image Size: 0xa000"
"6:17:25.7779794 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.Energy.dll","SUCCESS","Image Base: 0x7ffe25d00000, Image Size: 0x31000"
"6:17:25.7803267 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.Graphics.dll","SUCCESS","Image Base: 0x7ffe3a4f0000, Image Size: 0xa2000"
"6:17:25.7810059 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\cfgmgr32.dll","SUCCESS","Image Base: 0x7ffe443e0000, Image Size: 0x4e000"
"6:17:25.8147769 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\UIAutomationCore.dll","SUCCESS","Image Base: 0x7ffe312c0000, Image Size: 0x449000"
"6:17:25.8188417 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\sxs.dll","SUCCESS","Image Base: 0x7ffe44560000, Image Size: 0xa3000"
"6:17:25.8321928 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\efswrt.dll","SUCCESS","Image Base: 0x7ffe1ade0000, Image Size: 0xd0000"
"6:17:25.8530689 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\TextInputFramework.dll","SUCCESS","Image Base: 0x7ffe326b0000, Image Size: 0x143000"
"6:17:25.9396273 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ApplicationTargetedFeatureDatabase.dll","SUCCESS","Image Base: 0x7ffe1a800000, Image Size: 0x4b000"
"6:17:25.9414701 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\globinputhost.dll","SUCCESS","Image Base: 0x7ffe3a360000, Image Size: 0x29000"
"6:17:25.9602877 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\directmanipulation.dll","SUCCESS","Image Base: 0x7ffe32610000, Image Size: 0x9d000"
"6:17:25.9658188 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\MsSpellCheckingFacility.dll","SUCCESS","Image Base: 0x7ffe356a0000, Image Size: 0x123000"
"6:17:25.9673782 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\userenv.dll","SUCCESS","Image Base: 0x7ffe43cf0000, Image Size: 0x28000"
"6:17:25.9726363 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ELSCore.dll","SUCCESS","Image Base: 0x7ffe29f00000, Image Size: 0x19000"
"6:17:25.9762430 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\elsTrans.dll","SUCCESS","Image Base: 0x7ffe3b270000, Image Size: 0xd000"
"6:17:26.0247375 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\xmllite.dll","SUCCESS","Image Base: 0x7ffe40e40000, Image Size: 0x37000"
"6:17:26.0745602 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\wtsapi32.dll","SUCCESS","Image Base: 0x7ffe435b0000, Image Size: 0x14000"
"6:17:26.0762149 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\winsta.dll","SUCCESS","Image Base: 0x7ffe44610000, Image Size: 0x66000"
"6:17:26.1366337 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\CoreUIComponents.dll","SUCCESS","Image Base: 0x7ffe3d0e0000, Image Size: 0x36d000"
"6:17:28.9047182 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\dui70.dll","SUCCESS","Image Base: 0x7ffe0bf80000, Image Size: 0x1bc000"
"6:17:28.9067518 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\duser.dll","SUCCESS","Image Base: 0x7ffe12160000, Image Size: 0x99000"
"6:17:28.9557453 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\ExplorerFrame.dll","SUCCESS","Image Base: 0x7ffe295a0000, Image Size: 0x2b4000"
"6:17:28.9784272 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\WindowsCodecs.dll","SUCCESS","Image Base: 0x7ffe41a10000, Image Size: 0x1b1000"
"6:17:28.9930861 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\thumbcache.dll","SUCCESS","Image Base: 0x7ffe28700000, Image Size: 0x6a000"
"6:17:29.0371518 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\policymanager.dll","SUCCESS","Image Base: 0x7ffe3e3b0000, Image Size: 0xa5000"
"6:17:29.0384156 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\msvcp110_win.dll","SUCCESS","Image Base: 0x7ffe3e310000, Image Size: 0x93000"
"6:17:29.0781043 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\msftedit.dll","SUCCESS","Image Base: 0x7ffe24d70000, Image Size: 0x375000"
"6:17:29.0888471 PM","Notepad.exe","7592","Load Image","C:\Program Files\Common Files\microsoft shared\ink\tiptsf.dll","SUCCESS","Image Base: 0x7ffe1ac60000, Image Size: 0xa0000"
"6:17:29.0907445 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\atlthunk.dll","SUCCESS","Image Base: 0x7ffe204a0000, Image Size: 0xe000"
"6:17:29.1353495 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\apphelp.dll","SUCCESS","Image Base: 0x7ffe40360000, Image Size: 0x97000"
"6:17:29.1395652 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\networkexplorer.dll","SUCCESS","Image Base: 0x7ffe2b780000, Image Size: 0x1a000"
"6:17:29.1471843 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.System.Launcher.dll","SUCCESS","Image Base: 0x7ffe38d80000, Image Size: 0x13b000"
"6:17:29.1660453 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.FileExplorer.Common.dll","SUCCESS","Image Base: 0x7ffe27a00000, Image Size: 0xb6000"
"6:17:29.1681794 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\linkinfo.dll","SUCCESS","Image Base: 0x7ffe2d510000, Image Size: 0xd000"
"6:17:29.2148478 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\OneCoreCommonProxyStub.dll","SUCCESS","Image Base: 0x7ffe335d0000, Image Size: 0xb0000"
"6:17:29.3357835 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\edputil.dll","SUCCESS","Image Base: 0x7ffe32260000, Image Size: 0x28000"
"6:17:29.3859393 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\StructuredQuery.dll","SUCCESS","Image Base: 0x7ffe35fb0000, Image Size: 0xbc000"
"6:17:29.4446873 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\windowsudk.shellcommon.dll","SUCCESS","Image Base: 0x7ffe31890000, Image Size: 0x577000"
"6:17:29.4567823 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\sspicli.dll","SUCCESS","Image Base: 0x7ffe43a50000, Image Size: 0x43000"
"6:17:29.6080736 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\twinapi.dll","SUCCESS","Image Base: 0x7ffe2bc20000, Image Size: 0xca000"
"6:17:29.7104565 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\coml2.dll","SUCCESS","Image Base: 0x7ffe46c20000, Image Size: 0x7d000"
"6:17:29.7957036 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.Storage.Search.dll","SUCCESS","Image Base: 0x7ffe32290000, Image Size: 0xec000"
"6:17:29.8462810 PM","Notepad.exe","7592","Load Image","C:\Users\User\AppData\Local\Microsoft\OneDrive\24.201.1006.0005\FileSyncShell64.dll","SUCCESS","Image Base: 0x7ffe0ac40000, Image Size: 0x1d4000"
"6:17:29.8479731 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\secur32.dll","SUCCESS","Image Base: 0x7ffe435d0000, Image Size: 0xc000"
"6:17:29.8480046 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\wininet.dll","SUCCESS","Image Base: 0x7ffe38580000, Image Size: 0x4fe000"
"6:17:29.8482284 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\version.dll","SUCCESS","Image Base: 0x7ffe3ff40000, Image Size: 0xa000"
"6:17:29.8896235 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\EhStorShell.dll","SUCCESS","Image Base: 0x7ffe25b90000, Image Size: 0x37000"
"6:17:29.8897743 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\setupapi.dll","SUCCESS","Image Base: 0x7ffe45fc0000, Image Size: 0x474000"
"6:17:29.8951961 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\cscui.dll","SUCCESS","Image Base: 0x7ffe25ab0000, Image Size: 0xd2000"
"6:17:31.9613654 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.StateRepositoryPS.dll","SUCCESS","Image Base: 0x7ffe32380000, Image Size: 0xeb000"
"6:17:34.2158634 PM","Notepad.exe","7592","Load Image","C:\Windows\System32\Windows.UI.Core.TextInput.dll","SUCCESS","Image Base: 0x7ffe31710000, Image Size: 0x178000"
```
</details>

`notepad.exe` が依存している DLL は [Dependencies - An open-source modern Dependency Walker](https://github.com/lucasg/Dependencies) で調べることができ、実際 `Load Image` で読み込まれた DLL に依存していることがわかります。
<img src="notepad_exe_dependencies.png" width="100%">

## 終わりに

この記事では Windows におけるプロセスの起動を観察しました。
ソースコードが公開されていないため、詳細な実装は想像で書いている部分が多分にあります。

## 参考

- 『インサイドWindows 第7版 上 システムアーキテクチャ、プロセス、スレッド、メモリ管理、他 (マイクロソフト公式解説書) 』