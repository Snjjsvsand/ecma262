## 函数调用中词法/变量环境引用关系

#### prepareForOrdinaryCall 创建新的执行上下文并推入执行栈顶
```js
let calleeContext = new ECMAScriptCodeExecutionContext() 
```

  ##### 创建新的函数式环境（下称 funcEnv）并让执行上下文的词法与变量环境都指向此环境记录
```js
let localEnv = newFunctionEnvironment(f , newTarget)
calleeContext.lexicalEnvironment = localEnv
calleeContext.variableEnvironment = localEnv
```

  在创建函数环境时，新的环境函数的 outerEnv 指向函数实例生成时所在的执行上下文的词法环境:
```js
function newFunctionEnvironment(f: FunctionObject , newTarget: any) {
  ...
  let env = new FunctionEnvironmentRecord()
  env.outerEnv = f.environment
  ...
  return env
}
```

#### functionDeclarationInstantiation 进行函数声明实例化
  1. 绑定函数形参环境至环境(下称 env)并实例化 

```js
如果是严格模式或者函数参数没有默认值
  将参数直接绑定至 funcEnv
    let env = calleeContext.lexicalEnvironment
如果是非严格模式并且函数参数有默认值
  创建新的声明式环境用来绑定参数，并且此环境的 outerEnv 指向 funcEnv
    let env = newDeclarativeEnvironment(calleeEnv)

    function newDeclarativeEnvironment(e: EnvironmentRecord | null) { 
      let env = new DeclarativeEnvironmentRecord()
      env.outerEnv = e
      return env
    }
  最后再将此环境赋给 calleeContext 的词法环境
  calleeContext.lexicalEnvironment = env
```

  2. 绑定所有关键字 var 声明的 VariableStatement 标识符至环境(下称 varEnv)并实例化并初始化

```js
如果函数形参没有默认值，直接将标识符绑定到 env , 并且全部实例化并初始化为 undefined
  let varEnv = env
否则创建新的声明式环境用来绑定这些标识符 , 并且全部实例化并初始化为 undefined
此声明式环境的 outerEnv 指向 env
  let varEnv = newDeclarativeEnvironment(env)
并且将此环境赋给 calleeContext 的变量环境
  calleeContext.variableEnvironment = varEnv
```

  3. 绑定所有 let , const , class 声明的标识符至环境(下称 lexEnv)并实例化但并不初始化

```js
如果不是严格模式，创建新的声明式环境作为词法环境，并且将标识符绑定到新环境
  let lexEnv = newDeclarativeEnvironment(varEnv)
此声明式环境的 outerEnv 指向 varEnv
否则直接绑定到 varEnv
  let lexEnv = varEnv
其中， 对于 const 声明 lexEnv.createImmutableBinding(d , true)
对于其他声明 lexEnv.createMutableBinding(d , false) 
将此环境赋给 calleeContext 的词法环境
  calleeContext.lexicalEnvironment = lexEnv
```

  4. 绑定所有的函数声明标识符至变量环境，并且将对应的函数声明实例化为函数对象并使函数对象的 environment 属性指向 lexEnv 以形成“词法作用域链”

```js
for(let f of functionsToInitialize) {
  let fo = instantiateFunctionObject(lexEnv , privateEnv)
  varEnv.setMutableBinding(f , fo , false)
}

function instantiateFunctionObject(... , env , ...) {
  .... 
  ordinaryFunctionCreate(... , env , ...)
  ....
}

function ordinaryFunctionCreate(... , env , ...) {
  let f = new FunctionObject()
  ....
  f.environment = env 
  ....
}
```

#### 开始执行函数体内语句


## 函数调用过程中各种环境依赖情况
1. 严格模式，函数参数没有默认值
env == funcEnv
varEnv == env
lexEnv == varEnv

2. 严格模式，函数参数有默认值
env == funcEnv
varEnv.outerEnv == env
lexEnv == varEnv

3. 非严格模式，函数参数没有默认值
env == funcEnv
varEnv == env
lexEnv.outerEnv == varEnv

4. 非严格模式，函数参数有默认值
env.outerEnv == funcEnv
varEnv.outerEnv == env
lexEnv.outerEnv == varEnv


