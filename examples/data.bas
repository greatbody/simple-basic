10 REM DATA/READ/RESTORE demonstration
20 DATA "Alice", 25, "Bob", 30, "Charlie", 35
30 DATA "Diana", 28, "Eve", 32
40 PRINT "Reading names and ages:"
50 FOR I = 1 TO 5
60 READ NAME$, AGE
70 PRINT NAME$; " is "; AGE; " years old"
80 NEXT I
90 PRINT "Restoring and reading again:"
100 RESTORE
110 READ FIRST$, FIRST_AGE
120 PRINT "First person: "; FIRST$; " ("; FIRST_AGE; ")"
130 END
