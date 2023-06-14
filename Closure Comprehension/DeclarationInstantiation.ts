import { GlobalEnvironmentRecord } from "../Environment Records/Environment Records";
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

function functionDeclarationInstantiation(func: FunctionObject , argumentList: Array<any>) {
  let calleeContext = agent.runningExecutionContext as ECMAScriptCodeExecutionContext
  let code = func.ECMAScriptCode // parsed Node
  let strict = func.strict
  let formals = func.formalParameters
  // return BoundNames of formals
  let parameterNames = formals.map(item => String(item))

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

  let argumentsObjectNeeded = true
  if(func.thisMode === 'lexical') argumentsObjectNeeded = false
  else if(parameterNames.includes('arguments')) argumentsObjectNeeded = false
  else if(hasParameterExpressions === false && lexicalNames.includes('arguments'))  argumentsObjectNeeded = false

  let env

  if(strict || !hasParameterExpressions) env = calleeContext.lexicalEnvironment

}

export {
  globalDeclarationInstantiation,
  functionDeclarationInstantiation
}
