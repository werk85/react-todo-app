# Aufgabe 4

Erstelle ein Verzeichnis `src/components` und zerlege das Template in die folgenden Komponenten.

 * `Title` - Beinhaltet alles innerhalb des `card-header`s
 * `TodoForm` - Beinhaltet das Inputfeld und den `Add` Button
 * `Todo` - Beinhaltet das `li` Element und seine Kinder

Verwende die neu angelegten Komponenten in der `view` Funktion.

Achte dabei das die neu angelegten Komponenten keine Referenz zum `Model` oder `dispatch` Funktion haben dürfen um sie maximal wiederverwendbar zu machen. Übergebe entsprechend alle nötigen Variablen und Callback-Funktionen über entsprechende `props`.