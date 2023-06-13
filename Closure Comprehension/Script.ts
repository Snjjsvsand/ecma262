import { ECMAScriptCodeExecutionContext, ExecutionContext } from "./ExecutionContext";
import { EnvironmentRecord, GlobalEnvironmentRecord } from "../Environment Records/Environment Records";
import { RealmRecord } from "./Realm";
import { agent } from "./Agent";
import { globalDeclarationInstantiation } from "./DeclarationInstantiation";


class ScriptRecord {
  constructor(
    public realm: RealmRecord | undefined,
    public ecmaScriptCode: any, // parseNode,
    public loadedModules: Array<any>,
    public hostDefined: any
  ) { }
}

function parseScript(sourceText: string , realm: RealmRecord | undefined , hostDefined: any) {
  let script // = parseText(sourceText , Script)
  return new ScriptRecord(realm , script , [] , hostDefined)
}

function scriptEvaluation(scriptRecord: ScriptRecord) {
  let globalEnv = scriptRecord.realm?.globalEnv as GlobalEnvironmentRecord
  let scriptContext = new ECMAScriptCodeExecutionContext()
  scriptContext.function = null
  scriptContext.realm = scriptRecord.realm as RealmRecord
  scriptContext.scriptOrModule = scriptRecord
  
  /*
    This Execution Context is created by subclass,
    and it has environment records fields which equal with realm's globalEnv.
  */
  scriptContext.lexicalEnvironment = globalEnv
  scriptContext.variableEnvironment = globalEnv
  scriptContext.privateEnvironment = null

  agent.executionContextStack.push(scriptContext)
  agent.runningExecutionContext = scriptContext

  let script = scriptRecord.ecmaScriptCode
  let result
  try {
    result = globalDeclarationInstantiation(script , globalEnv)
    // result = Evaluation of script 
  } catch (error) {
    throw error
  }

  agent.executionContextStack.pop()
  agent.runningExecutionContext = agent.executionContextStack.top() as ExecutionContext

  return result
}


export {
  parseScript,
  scriptEvaluation
}
