# インサイド Windows 読書メモ

## カーネルデバッガを使えるようにする方法
- 仮想マシンを作る
    - [Windows での Hyper-V による仮想マシンの作成](https://learn.microsoft.com/ja-jp/virtualization/hyper-v-on-windows/quick-start/create-virtual-machine)
- 仮想マシンのアドレスは固定する
    - ここでは `192.168.11.90` にする
- ファイアウォールに穴を開ける
    - [特定のIPアドレスとの通信を全て許可するよう、セキュリティが強化されたWindowsファイアウォールを設定。](https://bluehircine.wordpress.com/2012/08/21/%E7%89%B9%E5%AE%9A%E3%81%AEip%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9%E3%81%A8%E3%81%AE%E9%80%9A%E4%BF%A1%E3%82%92%E5%85%A8%E3%81%A6%E8%A8%B1%E5%8F%AF%E3%81%99%E3%82%8B%E3%82%88%E3%81%86%E3%80%81%E3%82%BB/)
    - ローカルIP は `192.168.11.0/24`
    - リモートIP は `192.168.11.90`
- ゲストマシン、ホストマシンに [Windows Driver Kit (WDK) のダウンロード](https://learn.microsoft.com/ja-jp/windows-hardware/drivers/download-the-wdk) から WDK をインストールする
- [仮想マシンのネットワーク デバッグの設定 - KDNET](https://learn.microsoft.com/ja-jp/windows-hardware/drivers/debugger/setting-up-network-debugging-of-a-virtual-machine-host)
    - ゲストマシンで
        - `C:\KDNET` に移動
        - `kdnet 192.168.11.15 50005` を実行
    - ホストマシンで `"C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\windbg.exe"  -k net:port=50005,key=...` を実行
    - ゲストマシンで `shutdown -r -t 0` を実行して再起動
- そのままだと `Debuggee is running` となって何もできないので Debug -> Break で止めると以下のような画面になるので `0: kd>` の右のところにコマンドを打つ

```
*******************************************************************************
*                                                                             *
*   You are seeing this message because you pressed either                    *
*       CTRL+C (if you run console kernel debugger) or,                       *
*       CTRL+BREAK (if you run GUI kernel debugger),                          *
*   on your debugger machine's keyboard.                                      *
*                                                                             *
*                   THIS IS NOT A BUG OR A SYSTEM CRASH                       *
*                                                                             *
* If you did not intend to break into the debugger, press the "g" key, then   *
* press the "Enter" key now.  This message might immediately reappear.  If it *
* does, press "g" and "Enter" again.                                          *
*                                                                             *
*******************************************************************************
nt!DbgBreakPointWithStatus:
fffff804`6cc201d0 cc              int     3
```
```
0: kd>
```

- 例えば `dt nt!_KINTERRUPT` などと打つと以下のようになる

```
0: kd> dt nt!_KINTERRUPT
   +0x000 Type             : Int2B
   +0x002 Size             : Int2B
   +0x008 InterruptListEntry : _LIST_ENTRY
   +0x018 ServiceRoutine   : Ptr64     unsigned char 
   +0x020 MessageServiceRoutine : Ptr64     unsigned char 
   +0x028 MessageIndex     : Uint4B
   +0x030 ServiceContext   : Ptr64 Void
   +0x038 SpinLock         : Uint8B
   +0x040 TickCount        : Uint4B
   +0x048 ActualLock       : Ptr64 Uint8B
   +0x050 DispatchAddress  : Ptr64     void 
   +0x058 Vector           : Uint4B
   +0x05c Irql             : UChar
   +0x05d SynchronizeIrql  : UChar
   +0x05e FloatingSave     : UChar
   +0x05f Connected        : UChar
   +0x060 Number           : Uint4B
   +0x064 ShareVector      : UChar
   +0x065 EmulateActiveBoth : UChar
   +0x066 ActiveCount      : Uint2B
   +0x068 InternalState    : Int4B
   +0x06c Mode             : _KINTERRUPT_MODE
   +0x070 Polarity         : _KINTERRUPT_POLARITY
   +0x074 ServiceCount     : Uint4B
   +0x078 DispatchCount    : Uint4B
   +0x080 PassiveEvent     : Ptr64 _KEVENT
   +0x088 TrapFrame        : Ptr64 _KTRAP_FRAME
   +0x090 DisconnectData   : Ptr64 Void
   +0x098 ServiceThread    : Ptr64 _KTHREAD
   +0x0a0 ConnectionData   : Ptr64 _INTERRUPT_CONNECTION_DATA
   +0x0a8 IntTrackEntry    : Ptr64 Void
   +0x0b0 IsrDpcStats      : _ISRDPCSTATS
   +0x110 RedirectObject   : Ptr64 Void
   +0x118 Padding          : [8] UChar
```
