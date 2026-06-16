; Focus OS — NSIS Modern UI overrides (electron-builder include)
; Must live under resources/ (build/ is gitignored). Defines here run BEFORE MUI pages.

; Colors must be defined before assistedInstaller.nsh inserts pages (not in customHeader).
!define MUI_BGCOLOR "060E1C"
!define MUI_TEXTCOLOR "E8EEF4"
!define MUI_BRANDINGTEXTCOLOR "00E5A8"
!define MUI_CUSTOMFUNCTION_GUIINIT FocusOs_GuiInit

!macro customHeader
  !define /redef MUI_WELCOMEPAGE_TITLE "Welcome to Focus OS"
  !define /redef MUI_WELCOMEPAGE_TEXT "Your holographic command deck for freelance focus.$\r$\n$\r$\nThis installer deploys Focus OS on your machine — scheduling, tasks, journal, and your AI copilot, all local-first.$\r$\n$\r$\nClick Next to begin setup."

  !define /redef MUI_DIRECTORYPAGE_TEXT_TOP "Choose where Focus OS will live on this machine. You can change this later."
  !define /redef MUI_DIRECTORYPAGE_TEXT_DESTINATION "Deployment path"

  !define /redef MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Installing Focus OS"
  !define /redef MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "Copying modules and wiring your local command deck..."

  !define /redef MUI_FINISHPAGE_TITLE "Systems online"
  !define /redef MUI_FINISHPAGE_TEXT "Focus OS is installed and ready. Your schedule, tasks, and insights are one launch away."
  !define /redef MUI_FINISHPAGE_RUN_TEXT "Launch Focus OS"
  !define /redef MUI_FINISHPAGE_SHOWREADME_TEXT "Open install folder"

  !define /redef MUI_UNWELCOMEPAGE_TITLE "Remove Focus OS"
  !define /redef MUI_UNWELCOMEPAGE_TEXT "This will uninstall Focus OS from your computer.$\r$\n$\r$\nYour local database and settings in AppData are preserved unless you delete them manually."
!macroend

Function FocusOs_GuiInit
  ; Disable visual styles so MUI_BGCOLOR applies on Win10/11 wizard pages.
  System::Call 'user32::SetWindowTheme(p $HWNDPARENT, w " ", w " ")'
FunctionEnd
