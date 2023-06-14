import { newDeclarativeEnvironment } from "../Environment Records/Environment Record Operations";
import { DeclarativeEnvironmentRecord, EnvironmentRecord, GlobalEnvironmentRecord } from "../Environment Records/Environment Records";
import { agent } from "./Agent";
import { ECMAScriptCodeExecutionContext } from "./ExecutionContext";
import { FunctionObject, instantiateFunctionObject } from "./Function Object";
import { lexicallyDeclaredNames, lexicallyScopedDeclarations , varDeclaredNames, varScopedDeclaration } from "./Syntax-Directed Operation";

function globalDeclarationInstantiation(script: any , env: GlobalEnvironmentRecord) {
  let lexNames = lexicallyDeclaredNames(script)
  let varNames = varDeclaredNames(script)

  for(let name of lexNames) {
    if(env.hasLexicalDeclaration(name)) throw new SyntaxError()
    if(env.hasVarDeclaration(name)) throw new SyntaxError()
    if(env.hasRestrictedGlobalProperty(name)) throw new SyntaxError()
  }

  for(let name of varNames) {
    if(env.hasLexicalDeclaration(name)) throw new SyntaxError()
  }

  let varDeclarations = varScopedDeclaration()
  let functionsToInitialize = []
  let declaredFunctionNames = []

  for(let d of varDeclarations); // push legal function name to  functionsToInitialize and declaredFunctionNames
  // If there are multiple function declarations for the same name, the last declaration is used.
  

  let delcaredVarNames = []
  for(let d of varDeclarations) ; // push legal VariableStatment name to delcaredVarNames
  

  let lexDeclarations = lexicallyScopedDeclarations()
  let privateEnv = null

  for(let d of lexDeclarations) {
    /* 
      env.createMutableBinding or env.createImmutableBinding 
      just instantiated declared names but not initialized them.
      So that let and const declared variables can't used before lexical declaration execution.
    */
    // If IsConstantDeclaration of d is true
    if(Boolean()) env.createImmutableBinding(d , true)
    else env.createMutableBinding(d , false)
  }
  /*  
    For functions in top scope BlockStatment , 
    it will be instantiated and initialized to undefined in non-strict mode and won't be instantiate in strict mode.
  */
  for(let f of functionsToInitialize) {
    let fo = instantiateFunctionObject(env , privateEnv)
    env.createGlobalFunctionBinding(f , fo , false)
  }

  for(let vn of delcaredVarNames) {
    /*
      env.createGlobalVarBinding use objectRecord.createMutableBinding and objectRecord.initializeBinding(n , undefined)
      to instantiate and initialize variable so that we can use them before variable statement execution.
    */
    env.createGlobalVarBinding(vn , false)
  }
}

function hasDuplicatesFunc(arr: string[]) {
  let bag = new Set()
  for(let i = 0; i < arr.length; i++) {
    if(bag.has(arr[i])) return true
    bag.add(arr[i])
  }
  return false
}

function functionDeclarationInstantiation(func: FunctionObject , argumentList: Array<any>) {
  let calleeContext = agent.runningExecutionContext as ECMAScriptCodeExecutionContext
  let code = func.ECMAScriptCode // parsed Node
  let strict = func.strict
  let formals = func.formalParameters
  // return BoundNames of formals
  let parameterNames = formals.map(item => String(item))
  // 6. If parameterNames has any duplicate entries, let hasDuplicates be true. Otherwise, let hasDuplicates be false.
  let hasDuplicates: Boolean = hasDuplicatesFunc(parameterNames)
  // 7. Let simpleParameterList be IsSimpleParameterList of formals.
  let simpleParameterList = Boolean(formals)
  // 8. Let hasParameterExpressions be ContainsExpression of formals.
  let hasParameterExpressions = Boolean(formals)

  let varNames = varDeclaredNames(code)
  let varDeclarations = varScopedDeclaration(code)
  let lexicalNames: Array<string> = lexicallyDeclaredNames(code)
  let functionNames: Array<string> = []
  let functionsToInitialize = []

  for(let d of varDeclarations) {
    // If d is neither a VariableDeclaration nor a ForBinding nor a BindingIdentifier,
    // d is either a FunctionDeclaration, a GeneratorDeclaration, an AsyncFunctionDeclaration, or an AsyncGeneratorDeclaration.
    let fn = String(d)
    functionNames.unshift(fn)
    functionsToInitialize.unshift(d)
  }

  // omit 15 - 18 about argumentsObjectNeeded

  let env: EnvironmentRecord

  if(strict || !hasParameterExpressions) env = calleeContext.lexicalEnvironment
  else {
    let calleeEnv = calleeContext.lexicalEnvironment
    env = newDeclarativeEnvironment(calleeEnv)
    // assert calleeContext.lexicalEnvironment === calleeContext.variableEnvironment === calleeEnv

    calleeContext.lexicalEnvironment = env
  }

  // omit 21 - 26 about parameter binding and initialization in env Environment Record.
  let parameterBindings = ['binded and initialized parameters']
  

  let varEnv: EnvironmentRecord

  if(hasParameterExpressions) {
    let instantiatedVarNames = parameterBindings

    for(let n in varNames) {
      if(!instantiatedVarNames.includes(n)) {
        instantiatedVarNames.push(n)
        env.createMutableBinding(n , false)
        env.initializeBinding(n , undefined)
      }
    }
    varEnv = env

  }else {
    let instantiatedVarNames: string[] = []
    varEnv = newDeclarativeEnvironment(env)
    calleeContext.variableEnvironment = varEnv

    for(let n in varNames) {
      if(!instantiatedVarNames.includes(n)) {
        instantiatedVarNames.push(n)
        varEnv.createMutableBinding(n , false)

        // NOTE: A var with the same name as a formal parameter initially has the same value as the corresponding initialized parameter.
        let initialValue
        if(!parameterBindings.includes(n) || functionNames.includes(n)) initialValue = undefined
        else initialValue = env.getBindingValue(n , false)

        varEnv.initializeBinding(n , initialValue)
      }
    }
  }

  // omit B.3.2.1 addition
  
  let lexEnv: EnvironmentRecord
  
  if(strict === false) lexEnv = newDeclarativeEnvironment(varEnv)
  else lexEnv = varEnv

  calleeContext.lexicalEnvironment = lexEnv

  let lexDeclarations = lexicallyScopedDeclarations(code)

  for(let d of lexDeclarations) {
    // a. NOTE: A lexically declared name cannot be the same as a function/generator declaration, formal parameter, or a var name.
    // Lexically declared names are only instantiated here but not initialized.
    if('IsConstDeclaration') lexEnv.createImmutableBinding(d , true)
    else lexEnv.createMutableBinding(d , false) 
  }

  let privateEnv = calleeContext.privateEnvironment

  /*
    This step contains partial core of closure,
    the new function object has a environment field point to lexEnv which belongs to calleeContext.
  */
  for(let f of functionsToInitialize) {
    let fo = instantiateFunctionObject(lexEnv , privateEnv)
    varEnv.setMutableBinding(f , fo , false)
  }

}

export {
  globalDeclarationInstantiation,
  functionDeclarationInstantiation
}
