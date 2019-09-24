# Aufgabe 7

Speichere die Todos in PouchDB. Verwende hierzu die von PouchDB verfügbare REST-API und das `effe-ts` `http` Modul um mit der Datenbank zu kommunizieren.

## Einführung CouchDB/PouchDB

Starte die Anwendung über `yarn start`. Nach dem Start kannst du über [http://localhost:3000/_utils](http://localhost:3000/_utils) die Admnistrationsoberfläche der Datenbank betreten. Erstelle eine Datenbank mit dem Namen `todos` um die folgenden Beispiele zu verwenden.

Bei der Verwendung der Datenbank in der Anwendung kann die Route `/todos` verwendet werden ohne die Domaine anzugeben. Es ist eine entsprechende Proxy Route im `webpack-dev-server` konfiguriert um CORS Probleme zu vermeiden.

### Erstellen eines neuen Dokuments

```
curl -X PUT -H "Content-Type: application/json" http://localhost:3000/todos/todo1 -d '{ "text": "Test", "isDone": false }'
```

Ausgabe

```json
{"ok":true,"id":"todo1","rev":"1-9638470d21490de82008d20c230ab0d3"}
```

### Abfrage aller Dokumente

```
curl http://localhost:3000/todos/_all_docs?include_docs=true
```

Ausgabe

```json
{
  "total_rows": 1,
  "offset": 0,
  "rows": [
    {
      "id": "todo1",
      "key": "todo1",
      "value": {
        "rev": "1-9638470d21490de82008d20c230ab0d3"
      },
      "doc": {
        "text": "Test",
        "isDone": false,
        "_id": "todo1",
        "_rev": "1-9638470d21490de82008d20c230ab0d3"
      }
    }
  ]
}
```

### Ändern eines Dokuments

Hier muss die vorige `_rev` mit angegeben werden, da es sonst zu einem Dokumente Update Konflikt kommt

```
curl -X PUT -H "Content-Type: application/json" http://localhost:3000/todos/todo1 -d '{ "_rev": "1-9638470d21490de82008d20c230ab0d3", "text": "Test", "isDone": true }'
```

Ausgabe

```
{"ok":true,"id":"todo1","rev":"2-aa70faf922a81ce73ab54450b95a8a45"}
```

### Löschen eines Dokuments

```
curl -X DELETE http://localhost:3000/todos/todo1
```

oder

```
curl -X PUT -H "Content-Type: application/json" http://localhost:3000/todos/todo1 -d '{ "_rev": "2-aa70faf922a81ce73ab54450b95a8a45", "_deleted": true }'
```

