/*
  Statement:
    VariableStatement: var VariableDeclarationList

  Declaration

    HoistableDeclaration
      FunctionDeclaration
      GeneratorDeclatation
      AsyncFunctionDeclaration
      AsyncGeneratorDeclaration

    ClassDeclaration

    LexicalDeclatation
      LetOrConst
*/
function topLevelLexicallyDeclaredNames(script) {
  /*
    return BoundName list of Declaration without HoistableDeclaration.
  */
  return []
}

function topLevelVarDeclaredNames(script) {
  /*
    reutrn BoundName list of VariableStatement and HoistableDeclaration.
  */
 // Statement: BlockStatment
 // recure this method in block statement to hoist VariableStatment to global scope.
  return []
}

function lexicallyDeclaredNames(script) {
  // LexicallyDeclaredNames ScriptBody case.
  return topLevelLexicallyDeclaredNames(script)
}

function varDeclaredNames(script) {
  // VarDeclaredNames ScriptBody case.
  return topLevelVarDeclaredNames(script)
}

function lexicallyScopedDeclarations() {
  // Same as lexicallyDeclaredNames , but return a list of parse nodes.
  return []
}

function varScopedDeclaration(arg?: string ) {
  // Same as varDeclaredNames , but return a list of parse nodes.
  return []
}

export {
  lexicallyDeclaredNames,
  varDeclaredNames,
  lexicallyScopedDeclarations,
  varScopedDeclaration
}