import { initializeHostDefinedRealm } from "../Closure Comprehension/Realm"
import { parseScript, scriptEvaluation } from "../Closure Comprehension/Script"

// 1. 
const realm = initializeHostDefinedRealm()

// 2.
const scriptRecord = parseScript('<script> ... </script>' , realm , 'hostDefined')

// 3.
scriptEvaluation(scriptRecord)

/*
    function scriptEvaluation(scriptRecord: ScriptRecord) {
        let globalEnv = scriptRecord.realm?.globalEnv as GlobalEnvironmentRecord

        let scriptContext = new ECMAScriptCodeExecutionContext()
        scriptContext.function = null
        scriptContext.realm = scriptRecord.realm as RealmRecord
        scriptContext.scriptOrModule = scriptRecord
    

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

*/