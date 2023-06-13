import { GlobalEnvironmentRecord } from "../Environment Records/Environment Records";
import { instantiateFunctionObject } from "./Function Object";
import { lexicallyDeclaredNames, lexicallyScopedDeclarations, varDeclaredDeclatations, varDeclaredNames } from "./Syntax-Directed Operation";

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

  let varDeclarations = varDeclaredDeclatations()
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

export {
  globalDeclarationInstantiation
}
