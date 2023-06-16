## 闭包生成过程

在代码执行之前，必须创建执行上下文(Execution Context)及其拥有的环境记录器(Environment Record)，并紧随其后进行声明实例化（DeclarationInstantiation）。
声明实例化会扫描代码区域中所有的声明语句，并根据声明语句的类型，在环境记录器中对语句中的标识符作相应的绑定操作。
全局声明实例化不包含内嵌的函数，但会将函数名当作标识符进行绑定同时生成对应的函数对象；
函数声明实例化及模块声明实例化也不包含内层的函数。
有的地方会把“声明实例化”说成是“编译”，并说JavaScript会“先编译，后执行”。

  -- Lawliet01/everyone-can-read-spec


#### 生成函数实例过程

在各种声明实例化过程中遇到函数声明语句时： function func( ... ) { ... },
1. 全局声明实例化过程中 (globalDeclarationInstantiation)：
  创建函数实例对象 (function object) , 并将此对象的 environment 指向全局环境记录对象 globalEnv。
2. 函数声明实例化过程中 (functionDeclarationInstantiation)：
  创建函数实例对象 ，将此对象的 environment 指向正在实例化函数的执行上下文(calleeContext)的词法环境(lexicalEnvironment)，这样做使得 environment 一直存在于内存中，并这是闭包生成的根本原因；而当该函数实例对象被调用时，会创建新的执行上下文与新的词法环境，这个新的词法环境的 outerEnv 正是指向函数实例的 environment , 确定了标识符解析的作用域链。


#### 函数执行过程

在代码执行过程中遇到调用语句(CallExpression): func(...)
1. 由 EvaluateCall(func , ref , arguments , tailPosition) 调用 Call(func , thisValue , argList)
2. 由 Call(func , thisValue , argList) 调用 func.[[Call]]
3. 对于一般函数， [[Call]] 流程如下:
  1. 调用 PrepareForOrdinaryCall(func , newTarget)
    1. 记录正在执行的执行上下文(running execution context) callerContext
    2. 创建新的执行上下文 let calleeContext = new ECMAScriptCodeExecutionContext
    3. 创建新的 函数式环境记录 localEnv = new FunctionEnvironmentRecord() 并将 localEnv.outerEnv 指向 func.environment , 这一步是词法作用域链形成的根本原因
    4. 将 calleeContext的词法环境，变量环境全部指向 localEnv (calleeContext.lexicalEnvironment = localEnv, calleeContext.variableEnvironment = localEnv)
    5. 将 calleeContext 的私有环境指向 func.PrivateEnvironment
    6. 将正在执行的执行上下文 callerContext 挂起
    7. 将新的执行上下文 calleeContext push进入执行上下文栈（调用栈），成为新的正在执行上下文。
    8. 返回 calleeContext
  2. 处理函数被当作类构造器的情况
  3. 绑定 this
  4. 执行函数体
    1. 执行函数声明实例化(functionDeclarationInstantiation) : FunctionDeclarationInstantiation (func, argumentsList)
      1. 根据函数形参各种情况创建新的变量/词法环境以绑定参数及声明。
      2. 处理函数体内顶层的各种声明（let , const , var , function ....）
    2. 依次执行函数体内语句
  5. 函数体执行完毕，将 calleeContext 弹出执行栈，将 callerContext 恢复为正在执行上下文。
  6. 如果函数体执行期间有错误直接返回错误记录，否则返回函数体中 return 的结果。

