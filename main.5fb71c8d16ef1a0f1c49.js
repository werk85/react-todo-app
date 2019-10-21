!function(e){function t(t){for(var r,i,u=t[0],a=t[1],f=t[2],d=0,l=[];d<u.length;d++)i=u[d],Object.prototype.hasOwnProperty.call(o,i)&&o[i]&&l.push(o[i][0]),o[i]=0;for(r in a)Object.prototype.hasOwnProperty.call(a,r)&&(e[r]=a[r]);for(p&&p(t);l.length;)l.shift()();return c.push.apply(c,f||[]),n()}function n(){for(var e,t=0;t<c.length;t++){for(var n=c[t],r=!0,u=1;u<n.length;u++){var a=n[u];0!==o[a]&&(r=!1)}r&&(c.splice(t--,1),e=i(i.s=n[0]))}return e}var r={},o={1:0},c=[];function i(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=e,i.c=r,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)i.d(n,r,function(t){return e[t]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="";var u=window.webpackJsonp=window.webpackJsonp||[],a=u.push.bind(u);u.push=t,u=u.slice();for(var f=0;f<u.length;f++)t(u[f]);var p=a;c.push([171,0]),n()}({171:function(e,t,n){"use strict";n.r(t);var r,o=n(114),c=n.n(o),i=n(87),u=n.n(i),a=n(35),f=n.n(a),p=n(45),d=n(44),l=n(3),s=n(119),m=n(70),b=n(16),O=n(84),g=n(52),v=n(20),j=n(8),h=n(12),y=n(7),E=n(120),_=n(17),P=n(55),N=n(6),T=function(e){var t=e.stats;return N.createElement(N.Fragment,null,"Simple Todo ",Object(l.pipe)(t,y.fold((function(){return null}),(function(e){var t=e.done,n=e.total;return N.createElement("span",{className:"text-muted small"},t," / ",n)}))))},w=function(){return N.createElement("li",{className:"list-group-item"},N.createElement("em",null,"Task list is empty."))},x=function(){return N.createElement("li",{className:"list-group-item"},N.createElement("em",null,"Loading Tasks..."))},A=n(31),S=n(10),D=n(115),F=n(11),C=n(76),k=n(21),L=n(19),U=n(116),R=n(51),M=n(100),I=n(83),q=S.interface({_id:S.string,text:S.string,isDone:S.boolean,isFav:Object(D.withFallback)(S.boolean,!1)},"Todo"),B=function(e){return S.intersection([S.interface({_rev:S.string}),e])},J=S.interface({ok:S.boolean,id:S.string,rev:S.string},"Response"),W=Object(h.Union)({Add:Object(h.of)(),Change:Object(h.of)(),Load:Object(h.of)(),Remove:Object(h.of)(),Update:Object(h.of)()}),z=j.http.send(j.http.get("/todos/_all_docs?include_docs=true",(r=q,S.interface({total_rows:S.Int,offset:S.Int,rows:S.array(S.interface({id:S.string,key:S.string,doc:B(r),value:S.interface({rev:S.string})}))},"AllDocsResponse"))),W.Load),G=function(e){return j.http.send(j.http.del("/todos/".concat(e._id,"?_rev=").concat(e._rev),J),(function(t){return W.Remove({todo:e,response:t})}))},H=function(e){return j.http.send(j.http.put("/todos/".concat(e._id,"?rev=").concat(e._rev),B(q).encode(e),J),(function(t){return W.Update({todo:e,response:t})}))},K=new F.a,Q=new C.a("now"),V=new C.a(!1),X=Object(l.pipe)(Object(U.fromFetch)("/todos/_changes?feed=longpoll&include_docs=true&since=".concat(Q.value)),R.a((function(e){return Object(k.a)(e.json())})),M.a((function(e){e.results.forEach((function(e){return K.next(W.Change(function(e){return S.interface({changes:S.array(S.interface({rev:S.string})),doc:S.union([S.interface({_id:S.string,_rev:S.string,_deleted:S.literal(!0)}),B(e)]),id:S.string,seq:S.Int})}(q).decode(e)))})),Q.next(e.last_seq)})),R.a((function(){return X})));Object(l.pipe)(V,I.a(),R.a((function(e){return e?X:Object(L.b)()}))).subscribe();var Y=function(){return V.next(!0),K},Z=function(){return V.next(!1),Object(L.b)()},$=function(e){var t=e.value,n=e.onChange,r=e.onSubmit;return N.createElement("form",{onSubmit:function(e){r(),e.preventDefault()}},N.createElement("div",{className:"input-group"},N.createElement("input",{type:"text",className:"form-control",name:"task",value:t,onChange:function(e){return n(e.target.value)}}),N.createElement("div",{className:"input-group-append"},N.createElement("button",{type:"submit",className:"btn btn-primary",disabled:""===t},"Add"))))},ee=function(e){return 16807*e%2147483647},te=n(117),ne=n.n(te),re=A.a.fromProp()("seed"),oe=A.a.fromProp()("todo"),ce=oe.composeLens(A.a.fromProp()("text")),ie=Object(h.Union)({Add:Object(h.of)(),Api:Object(h.of)(),UpdateText:Object(h.of)()}),ue=function(e){return{_id:ne.a.v1({msecs:e}),text:"",isDone:!1,isFav:!1}},ae=n(48),fe=n(49),pe=n(99),de=function(e){var t=e.isFav,n=e.isDone,r=e.text,o=e.onEdit,c=e.onToggleFav,i=e.onToggleDone,u=e.onRemove;return N.createElement("li",{className:"task-container list-group-item d-flex justify-content-between align-items-center"},N.createElement("div",null,N.createElement("a",{href:"#",className:"btn-left",onClick:c},N.createElement(ae.a,{icon:t?fe.d:pe.b})),N.createElement("a",{href:"#",className:"btn-left",onClick:i},N.createElement(ae.a,{icon:n?fe.a:pe.a})),n?N.createElement("del",{className:"text-muted"},r):r),N.createElement("div",null,N.createElement("a",{href:"#",className:"btn-right",onClick:o},N.createElement(ae.a,{icon:fe.b})),N.createElement("a",{href:"#",className:"btn-right",onClick:u},N.createElement(ae.a,{icon:fe.e}))))},le=function(e){var t=e.text,n=e.onChange,r=e.onSave,o=e.onCancel;return N.createElement("li",{className:"task-container list-group-item"},N.createElement("form",{onSubmit:function(e){r(),e.preventDefault()}},N.createElement("div",{className:"input-group"},N.createElement("input",{className:"form-control",type:"text",value:t,onChange:n}),N.createElement("div",{className:"input-group-append"},N.createElement("button",{className:"btn btn-success",type:"submit"},N.createElement(ae.a,{icon:fe.c})),N.createElement("button",{className:"btn btn-danger",type:"button",onClick:o},N.createElement(ae.a,{icon:fe.e}))))))};function se(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function me(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?se(n,!0).forEach((function(t){u()(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):se(n).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}var be=Object(h.Union)({Editing:Object(h.of)(),None:Object(h.of)()}),Oe=new A.a((function(e){return be.match(e,{Editing:function(e){return e},None:function(e){return e}})}),(function(e){return function(t){return be.match(t,{Editing:function(t,n){return be.Editing(e,n)},None:function(){return be.None(e)}})}})),ge=Oe.composeLens(A.a.fromProp()("isDone")),ve=Oe.composeLens(A.a.fromProp()("isFav")),je=(Oe.composeLens(A.a.fromProp()("_id")),Oe.composeLens(A.a.fromProp()("_rev"))),he=Oe.composeLens(A.a.fromProp()("text")),ye=new A.b((function(e){return be.match(e,{Editing:function(e,t){return y.some(t)},default:function(){return y.none}})}),(function(e){return function(t){return be.match(t,{Editing:function(t){return be.Editing(t,e)},default:function(){return t}})}})),Ee=Object(h.Union)({Api:Object(h.of)(),Cancel:Object(h.of)(),Edit:Object(h.of)(),Save:Object(h.of)(),ToggleDone:Object(h.of)(),ToggleFav:Object(h.of)(),Remove:Object(h.of)(),UpdateText:Object(h.of)()}),_e=function(e){return[be.None(e),j.cmd.none]},Pe=n(118);function Ne(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}var Te=Object(p.contramap)(he.get)(p.ordString),we=Object(p.contramap)(ge.get)(p.ordBoolean),xe=Object(p.getSemigroup)().concat(we,Te),Ae=g.sort(Object(p.contramap)((function(e){var t=f()(e,2);t[0];return t[1]}))(xe)),Se=d.fromFoldableMap(Object(O.getFirstSemigroup)(),g.array),De=m.Lens.fromProp()("current"),Fe=m.Lens.fromProp()("todos"),Ce=Fe.composePrism(m.Prism.some()),ke=function(e){return Ce.composeLens(Object(s.atRecord)().at(e)).composePrism(m.Prism.some())},Le=Object(h.Union)({Api:Object(h.of)(),Todo:Object(h.of)(),TodoForm:Object(h.of)()}),Ue=j.cmd.getMonoid(),Re=j.html.programWithFlags((function(e){var t,n,r=(t=e.seed,[{seed:n=function(e){var t=e%2147483647;return t<=0?t+2147483646:t}(t),todo:ue(n)},j.cmd.none]),o=f()(r,2),c=o[0],i=o[1];return[{current:c,todos:y.none},Object(P.fold)(Ue)([Object(l.pipe)(z,j.cmd.map(Le.Api)),Object(l.pipe)(i,j.cmd.map(Le.TodoForm))])]}),(function(e,t){return Le.match(e,{Api:function(e){return W.match(e,{Add:function(e){var n=e.todo,r=e.response;return Object(l.pipe)(r,b.fold((function(){return[t,j.cmd.none]}),(function(e){var r=_e(function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?Ne(n,!0).forEach((function(t){u()(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Ne(n).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({},n,{_rev:e.body.rev})),o=f()(r,2),c=o[0],i=o[1];return[Object(l.pipe)(t,Ce.modify(d.insertAt(e.body.id,c))),Object(l.pipe)(i,j.cmd.map((function(e){return Le.Todo(n._id,e)})))]})))},Change:b.fold((function(){return[t,j.cmd.none]}),(function(e){var n=e.doc;if("_deleted"in n)return[Object(l.pipe)(t,Ce.modify(d.deleteAt(n._id))),j.cmd.none];var r=_e(n),o=f()(r,2),c=o[0],i=o[1];return[Object(l.pipe)(t,Ce.modify(d.insertAt(n._id,c))),Object(l.pipe)(i,j.cmd.map((function(e){return Le.Todo(n._id,e)})))]})),Load:b.fold((function(){return[t,j.cmd.none]}),(function(e){var n=e.body.rows.map((function(e){return e.doc})).map((function(e){return v.tuple.apply(void 0,[e._id].concat(c()(_e(e))))})),r=Se(n,(function(e){var t=f()(e,2);return[t[0],t[1]]})),o=n.map((function(e){var t=f()(e,3),n=t[0],r=(t[1],t[2]);return Object(l.pipe)(r,j.cmd.map((function(e){return Le.Todo(n,e)})))}));return[Object(l.pipe)(t,Fe.set(y.some(r))),Object(P.fold)(Ue)(o)]})),Remove:function(e){var n=e.todo,r=e.response;return Object(l.pipe)(r,b.fold((function(){return[t,j.cmd.none]}),(function(){return[Object(l.pipe)(t,Ce.modify(d.deleteAt(n._id))),j.cmd.none]})))},Update:function(e){var n=e.todo,r=e.response;return Object(l.pipe)(r,b.fold((function(){return[t,j.cmd.none]}),(function(e){return[Object(l.pipe)(t,(r=n._id,ke(r).composeLens(je)).set(e.body.rev)),j.cmd.none];var r})))}})},Todo:function(e,n){return Object(l.pipe)(t,ke(e).getOption,y.fold((function(){return[t,j.cmd.none]}),(function(r){var o=function(e,t){return be.match(t,{Editing:function(n,r){return Ee.match(e,{Cancel:function(){return[be.None(n),j.cmd.none]},Save:function(){return[be.None(me({},n,{text:r})),Object(l.pipe)(H(me({},n,{text:r})),j.cmd.map(Ee.Api))]},UpdateText:function(e){return[Object(l.pipe)(t,ye.set(e)),j.cmd.none]},default:function(){return[t,j.cmd.none]}})},None:function(n){return Ee.match(e,{Api:function(e){return W.match(e,{Change:function(e){return Object(l.pipe)(e,y.fromEither,y.filter((function(e){return e.doc._id===n._id})),y.fold((function(){return[t,j.cmd.none]}),(function(e){var n=e.doc;return[Object(l.pipe)(t,je.set(n._rev)),j.cmd.none]})))},default:function(){return[t,j.cmd.none]}})},Edit:function(){return[be.Editing(n,n.text),j.cmd.none]},Remove:function(){return[t,Object(l.pipe)(G(n),j.cmd.map(Ee.Api))]},ToggleDone:function(){var e=Object(l.pipe)(t,ge.modify(Object(v.not)(v.identity)));return[e,be.match(e,{None:function(e){return Object(l.pipe)(H(e),j.cmd.map(Ee.Api))},default:function(){return j.cmd.none}})]},ToggleFav:function(){var e=Object(l.pipe)(t,ve.modify(Object(v.not)(v.identity)));return[e,be.match(e,{None:function(e){return Object(l.pipe)(H(e),j.cmd.map(Ee.Api))},default:function(){return j.cmd.none}})]},default:function(){return[t,j.cmd.none]}})}})}(n,r),c=f()(o,2),i=c[0],u=c[1];return[Object(l.pipe)(t,ke(e).set(i)),Object(l.pipe)(u,j.cmd.map((function(t){return Le.Todo(e,t)})))]})))},TodoForm:function(e){var n=function(e,t){return ie.match(e,{Add:function(){return[Object(l.pipe)(t,re.modify(ee),oe.set(ue(t.seed))),Object(l.pipe)((e=t.todo,j.http.send(j.http.put("/todos/".concat(e._id),q.encode(e),J),(function(t){return W.Add({todo:e,response:t})}))),j.cmd.map(ie.Api))];var e},UpdateText:function(e){var n=e.text;return[Object(l.pipe)(t,ce.set(n)),j.cmd.none]},default:function(){return[t,j.cmd.none]}})}(e,t.current),r=f()(n,2),o=r[0],c=r[1];return[Object(l.pipe)(t,De.set(o)),Object(l.pipe)(c,j.cmd.map(Le.TodoForm))]},default:function(){return[t,j.cmd.none]}})}),(function(e){var t=Object(l.pipe)(e.todos,y.map((function(e){return E.fromArray(Ae(d.toArray(e)))}))),n=Object(l.pipe)(t,y.flatten,y.map((function(e){return{done:e.filter((function(e){var t=f()(e,2),n=(t[0],t[1]);return ge.get(n)})).length,total:e.length}})));return function(r){return N.createElement("div",{className:"card"},N.createElement("div",{className:"card-header"},N.createElement("h3",{className:"card-title"},N.createElement(T,{stats:n}))),N.createElement("div",{className:"card-body"},function(e){return function(t){return N.createElement($,{value:e.todo.text,onChange:function(e){return t(ie.UpdateText({text:e}))},onSubmit:function(){return t(ie.Add())}})}}(e.current)((function(e){return r(Le.TodoForm(e))}))),N.createElement("ul",{className:"list-group list-group-flush"},Object(l.pipe)(t,y.fold((function(){return N.createElement(x,null)}),y.fold((function(){return N.createElement(w,null)}),(function(e){return N.createElement(N.Fragment,null,e.map((function(e){var t=f()(e,2),n=t[0];return function(e){return function(t){return be.match(e,{Editing:function(e,n){return N.createElement(le,{key:e._id,text:n,onCancel:function(){return t(Ee.Cancel())},onChange:function(e){return t(Ee.UpdateText(e.target.value))},onSave:function(){return t(Ee.Save())}})},None:function(e){return N.createElement(de,Object.assign({key:e._id},e,{onEdit:function(){return t(Ee.Edit())},onRemove:function(){return t(Ee.Remove())},onToggleDone:function(){return t(Ee.ToggleDone())},onToggleFav:function(){return t(Ee.ToggleFav())}}))}})}}(t[1])((function(e){return r(Le.Todo(n,e))}))})))}))))))}}),(function(e){return Object(l.pipe)(e.todos,y.fold(Z,Y),_.a(Le.Api))}));j.html.run(Re({seed:Date.now()*Math.random()}),(function(e){Pe.render(e,document.getElementById("app"))}))}});
//# sourceMappingURL=main.5fb71c8d16ef1a0f1c49.js.map