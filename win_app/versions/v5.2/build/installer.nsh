!macro customInstall
  ${If} $LANGUAGE == 1036
    FileOpen $0 "$INSTDIR\lang.txt" w
    FileWrite $0 "fr"
    FileClose $0
  ${Else}
    FileOpen $0 "$INSTDIR\lang.txt" w
    FileWrite $0 "en"
    FileClose $0
  ${EndIf}
!macroend
