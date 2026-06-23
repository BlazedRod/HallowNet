; ─────────────────────────────────────────────────────────────────────────────
; HALLOW NET NSIS INSTALLER SCRIPT
; ─────────────────────────────────────────────────────────────────────────────

; ── Welcome Page ──────────────────────────────────────────────────────────────
!define MUI_WELCOMEPAGE_TITLE "Welcome to HallowNet"
!define MUI_WELCOMEPAGE_TEXT "You are about to enter the web as it was meant to be experienced — dark, fast, and unshackled.$\r$\n$\r$\nHallowNet is a gothic browser built for those who refuse the ordinary. Ad-blocked by default. Ghost Mode. Macro Automaton. The web, haunted.$\r$\n$\r$\nClick Next to begin your descent."

; ── Finish Page ───────────────────────────────────────────────────────────────
!define MUI_FINISHPAGE_TITLE "The Ritual Is Complete"
!define MUI_FINISHPAGE_TEXT "HallowNet has been bound to your machine.$\r$\n$\r$\nThe darkness awaits. Browse without fear — and without ads."

; ── Pre-Install Hook ──────────────────────────────────────────────────────────
!macro customInit
  ; Read the uninstall string from the registry to see if HallowNet is already installed
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "UninstallString"
  StrCmp $R0 "" checkMachine

  ; If found in Current User, ask for exorcism
  Goto promptUninst

  checkMachine:
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "UninstallString"
  StrCmp $R0 "" done

  promptUninst:
  MessageBox MB_YESNO|MB_ICONEXCLAMATION "A previous incarnation of HallowNet is haunting this machine.$\r$\n$\r$\nWould you like to exorcise (uninstall) the old version before proceeding?" /SD IDYES IDNO skipUninstall
  
  ; Run uninstaller silently
  ExecWait '"$R0" /S _?=$INSTDIR'
  Goto done

  skipUninstall:
  Abort "Installation aborted. You must uninstall the old version to proceed."

  done:
!macroend
