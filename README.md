# react-todo-app

Reference implementation of the todo-app project. This project is for learning purposes only.

## Usage

```sh
yarn install
yarn start
```

Before you can use the application you need to create the `todos` database in the `pouchdb-server`. Run the following code on your command line.

```
curl -X PUT http://localhost:3000/todos
```

You can access the `pouchdb-server` Administration UI via [http://localhost:3000/_utils](http://localhost:3000/_utils)
